/**
 **********************************************************************************************************************************************************************
 * @author gmalu (Ghanshyam Malu)
 * June 17, 2015
 * 
 * Hive Executor Java Client
 * Executes the given Hive Query File on the Hive Server and exports the results to the Output File
 * 
 * Usage : java HiveExecutor <jobID> <outputDataDir> <hiveUserName> <hiveHost> <dbName> <hiveQueryFile> <mongoDBhost> <mongoDBport> <mongoDBName> <mongoDBCollection>
 * 
 * Also, maintains the JobStatus in the MongoDB for tracking purpose
 ********************************************************************************************************************************************************************** 
 */

import java.sql.SQLException;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;
import java.sql.DriverManager;
import java.util.Arrays;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.apache.log4j.Logger;

/**
 * Core class of the HiveExecutor Program
 * @author gmalu
 *
 */
public class HiveExecutor {
	private static String driverName = "org.apache.hive.jdbc.HiveDriver";
	private String jobID;
	private String jobName;
	private String hiveHost;
	private String hiveDBName;
	private String hiveUser;
	private String queryFilePath;
	private Connection con;
	private Statement stmt;
	private String statusFilePath;
	private String outputDir ;
	private String resultFilePath;
	private ResultSet res;
	private Exception occurredException;
	private MongoExecutor mongoExecutor;

	//  Hive Connection Login Timeout
	public static int HIVE_ESTABLISH_CONNECTION_TIMEOUT = 10 ; //seconds
		
	//	Get the Logger information for Log4j
    static final Logger debugLogger = Logger.getLogger("debugLogger");
    static final Logger reportLogger = Logger.getLogger("reportLogger");
   
    // enum to maintain Job Status 
	public enum JobStatus {
		NOT_STARTED, SUCCESS, FAILED, IN_PROGRESS
	}
 
	private JobStatus jobStatus;
	
	/**
	 * Initializing the class parameters from the program arguments
	 * @param args
	 * @throws IOException
	 */
	HiveExecutor (String [] args) throws IOException{	
		debugLogger.debug("Initializing the class parameters from the arguments");
		
		this.jobID = args[0];
		this.jobName = args[1];
		this.outputDir = args[2];
		this.hiveUser = args[3];
		this.hiveHost = args[4];
		this.hiveDBName = args[5];
		this.queryFilePath = args[6];
		this.resultFilePath = this.outputDir +"/result.txt";
		this.statusFilePath = this.outputDir +"/status.txt";
		this.jobStatus = JobStatus.NOT_STARTED;
		
		// Establish MongoDB Connection 
		// args[7] = mongoHostAddress = "localhost"
		// args[8] = port = "27017"
		// args[9] = dashboardDB = "SelfServiceHiveDashboard"
		// args[10] = dashboardDBCollection = "AdHocJob"
		
		try {
			debugLogger.debug("Creating MongoExecutor Object");
			this.mongoExecutor = new MongoExecutor(args[7], Integer.parseInt(args[8]));
			
			debugLogger.debug("Establishing MongoDB Connection for maintaining Job Status Details in the database");
			this.mongoExecutor.connectDBCollection(args[9], args[10] );		
		} catch (Exception e) {
			e.printStackTrace();			
			debugLogger.error("Exception connecting to MongoDB : ", e);
			reportLogger.error("Error connecting to MongoDB : ",e);
			System.exit(1);
		}
		
	}
	
	/**
	 * Prints the Job Metadata onto the Logger
	 */
	private void printMetaData(){
		
		debugLogger.info("Job ID: " + this.jobID);
		debugLogger.info("Job Name: " + this.jobName);
		debugLogger.info("outputDir: "+ this.outputDir);		
		debugLogger.info("queryFilePath: "+this.queryFilePath);
		debugLogger.info("resultFilePath: "+ this.resultFilePath);
		debugLogger.info("statusFilePath: "+this.statusFilePath);

		reportLogger.info("Job ID: " + this.jobID);
		reportLogger.info("Job Name: " + this.jobName);
				
	}
	
	/**
	 * Displays the Program Usage
	 */
	private static void usage() {
		System.err.println("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		debugLogger.error("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		reportLogger.error("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		System.exit(1);
	}

	/**
	 * Establish Hive Connection
	 * @throws SQLException
	 */
	private void establishHiveConnection()  throws SQLException{
		
		try {
			Class.forName(driverName);
			String connectionURL = "jdbc:hive2://" + hiveHost + "/" + hiveDBName;
			
			debugLogger.debug("Login TimeOut to Hive Server set to : "+ HIVE_ESTABLISH_CONNECTION_TIMEOUT + " seconds");
			DriverManager.setLoginTimeout(HIVE_ESTABLISH_CONNECTION_TIMEOUT);
			
			debugLogger.debug("Connecting to Hive Server with parameters - URL:- '" + connectionURL + "' , hiveUser: '"+hiveUser+"'");
			reportLogger.debug("Connecting to Hive Server with parameters - URL:- '" + connectionURL + "' , hiveUser: '"+hiveUser+"'");

			this.con = DriverManager.getConnection(connectionURL, hiveUser, "");
			// Connection con = DriverManager.getConnection("jdbc:hive2://172.16.226.129:10000/default", "hive", "");
			this.stmt = con.createStatement();

		}
		catch (Exception e) {	
			debugLogger.error("Exception Establishing Hive Connection : ", e);
			reportLogger.error("Exception Establishing Hive Connection : ", e);
			
			// Update the Status in MongoDB
			this.mongoExecutor.updateStatusDocument(this.jobID, getJobStatusValue(JobStatus.FAILED) );
			debugLogger.debug("Updated the Job Run Status in MongoDB :" + this.jobID +" : " + getJobStatusValue(JobStatus.FAILED) );

			// Close MongoDB connection
			this.mongoExecutor.closeConnection();
			debugLogger.debug("Closed the MongoDB connection");

			e.printStackTrace();	
			
			debugLogger.error("JOB_FAILED");
			reportLogger.error("JOB_FAILED");

			System.exit(1);
		}
		
	}

	/**
	 * Read the Hive Query File
	 * @param path
	 * @return
	 * @throws IOException
	 */
	private String readFile(String path) throws IOException {
		debugLogger.debug("Reading the Query File : "+path);
		reportLogger.debug("Reading the Query");
		byte[] encoded = Files.readAllBytes(Paths.get(path));
		String query = new String(encoded, Charset.defaultCharset());
		query = query.replaceAll("\r", "").replaceAll("\n", " ").replaceAll(";", "");
		return query;
	}
	
	/**
	 * Execute the Hive Query
	 * @param sql
	 * @throws IOException
	 * @throws SQLException
	 */
	private void executeQuery(String sql)   throws IOException, SQLException {
		
		
		try {
			
			debugLogger.debug("Executing Query : "+sql);
			reportLogger.debug("Executing Query : "+sql);
				
			this.res = stmt.executeQuery(sql);
			this.jobStatus = JobStatus.SUCCESS;
			
			debugLogger.debug("Query Execution Completed");
			reportLogger.debug("Query Execution Completed");
			
		
		} catch (Exception e){
			debugLogger.error("Exception executing Hive Query : ",e);
			reportLogger.error("Exception executing Hive Query : ", e);
			
			this.occurredException = e;
			this.jobStatus = JobStatus.FAILED;
		} 
				
	}
	
	/**
	 * Create the output data directory
	 */
	private void createOutputDirectory(){
		String dirname = this.outputDir;
	      File d = new File(dirname);
	      // Create directory now.
	      d.mkdirs();
	      debugLogger.debug("Created Output Directory : " + dirname );
	}

	/**
	 * Export the Query Results to the Result File
	 * @throws SQLException
	 * @throws FileNotFoundException
	 * @throws UnsupportedEncodingException
	 */
	private void exportResult() throws SQLException, FileNotFoundException, UnsupportedEncodingException{
			
		PrintWriter writerResult = new PrintWriter(this.resultFilePath, "UTF-8");
		
		switch(this.jobStatus) {
		
			case FAILED:
				debugLogger.debug("Exporting "+getJobStatusValue(this.jobStatus)+" to Result File");
				writerResult.println(getJobStatusValue(this.jobStatus));
				break;
			
			case SUCCESS:
				debugLogger.debug("Exporting Results to File");
				reportLogger.info("Exporting Results to File");
				
				ResultSetMetaData rsmd;
				boolean headerPrinted = false;
				
				while (this.res.next()) {
					rsmd = this.res.getMetaData();
					int numOfCols = rsmd.getColumnCount();
					
					if (!headerPrinted){
						debugLogger.debug("Printing Column Headers to Result File");
						for (int i = 1; i <= numOfCols; i++) {
							writerResult.print(rsmd.getColumnName(i).toUpperCase());
							if (i != numOfCols){
								writerResult.print("\t");
							}
						}
						writerResult.println();
						headerPrinted = true;
					}
					
										
					for (int i = 1; i <= numOfCols; i++) {	
						writerResult.print(this.res.getString(i));
						if (i != numOfCols){
							writerResult.print("\t");
						}
					}
					writerResult.println();
				}
				debugLogger.debug("Export to Result File completed : "+this.resultFilePath);
				reportLogger.info("Export to Result File completed");
				break;
				
		default:
			break;
			
		}
		
		writerResult.close();
		
		
	}

	/**
	 * Update the Job Status in Status File and MongoDB
	 * @throws FileNotFoundException
	 * @throws UnsupportedEncodingException
	 */
	private void updateStatus() throws FileNotFoundException, UnsupportedEncodingException {
		
		// Update the Status File
		PrintWriter writerStatus = new PrintWriter(this.statusFilePath, "UTF-8");
		
		debugLogger.debug("Updated the Status File to "+getJobStatusValue(this.jobStatus));
		reportLogger.info("Updated the Status File to "+getJobStatusValue(this.jobStatus));
		
		writerStatus.print(getJobStatusValue(this.jobStatus));
		writerStatus.close();
		
		// Update the Status in MongoDB
		this.mongoExecutor.updateStatusDocument(this.jobID, getJobStatusValue(this.jobStatus) );
		debugLogger.debug("Updated the Status of JobID - "+this.jobID+" to "+getJobStatusValue(this.jobStatus)+" in MongoDB");
	
	}
	
	/**
	 * Get the Labels for the different Job Status types
	 * @param jobStatus
	 * @return
	 */
	public static String getJobStatusValue(JobStatus jobStatus){	
		
		switch (jobStatus){
		
		  case SUCCESS:     
			  return "JOB_SUCCESSFUL";
			  
		  case NOT_STARTED:   
			  return "JOB_NOT_STARTED";
			  
		  case FAILED:  
			  return "JOB_FAILED";
			  
		  case IN_PROGRESS:    
			  return "JOB_IN_PROGRESS";
			  
		  default:      
			  return null;
		 }
	 }
	
	/**
	 * Main program
	 * @param args
	 * @throws SQLException
	 * @throws IOException
	 */
	public static void main(String[] args)  throws SQLException, IOException {
				
		// Validate the number of arguments supplied
		if (args.length != 11) {
			debugLogger.warn("Number of arguments != 11");
			debugLogger.debug("Arguments: "+ Arrays.toString(args));
			usage();
		}
		
		reportLogger.info("***** Beginning Execution of Hive Executor Java Client *****");
		debugLogger.info("***** Beginning Execution of Hive Executor Java Client *****");
		
		// Create new object and initialize the program parameters using the arguments
		HiveExecutor hiveExecObj = new HiveExecutor(args);
		
		// Print the Job metadata
		hiveExecObj.printMetaData();
		
		// Update the Job Status to IN_PROGRESS
		hiveExecObj.jobStatus = JobStatus.IN_PROGRESS;
		hiveExecObj.updateStatus();
		
		// Establish Hive Connection
		hiveExecObj.establishHiveConnection();
		
		// Read the Hive Query File
		String sql = hiveExecObj.readFile(hiveExecObj.queryFilePath);
		
		// Create Output Directory
		hiveExecObj.createOutputDirectory();
		
		// Execute the Hive Query
		hiveExecObj.executeQuery(sql);
				
		// Export the Hive Results to the Result File
		hiveExecObj.exportResult();

		// Update the final Job Status
		hiveExecObj.updateStatus();
		
		reportLogger.info("***** Ending Execution of Hive Executor Java Client *****");
		debugLogger.info("***** Ending Execution of Hive Executor Java Client *****");
				
	}

}
