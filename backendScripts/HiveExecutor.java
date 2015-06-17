/**
 * @author gmalu
 *
 */

import java.sql.SQLException;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
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
	private String logFilePath;
	private String outputDir ;
	private String resultFilePath;
	private ResultSet res;
	private Exception occurredException;
	private PrintWriter writerLog;
	private MongoExecutor mongoExecutor;

	public static int HIVE_ESTABLISH_CONNECTION_TIMEOUT = 10 ; //seconds
	
	/* Get actual class name to be printed on */
   static final Logger debugLogger = Logger.getLogger("debugLogger");
   static final Logger reportLogger = Logger.getLogger("reportLogger");
   
	public enum JobStatus {
		NOT_STARTED, SUCCESS, FAILED, IN_PROGRESS
	}
 
	private JobStatus jobStatus;
	
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
		this.logFilePath = this.outputDir +"/log.txt";
		this.jobStatus = JobStatus.NOT_STARTED;
		this.writerLog = new PrintWriter(new FileWriter(this.logFilePath, true)); 
		
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
	
	private void printMetaData(){
	
		this.writerLog.println("Job ID: " + this.jobID);
		this.writerLog.println("Job Name: " + this.jobName);
		this.writerLog.println("outputDir: "+ this.outputDir);		
		this.writerLog.println("queryFilePath: "+this.queryFilePath);
		this.writerLog.println("resultFilePath: "+ this.resultFilePath);
		this.writerLog.println("statusFilePath: "+this.statusFilePath);
		this.writerLog.println("\n");
		
		debugLogger.info("Job ID: " + this.jobID);
		debugLogger.info("Job Name: " + this.jobName);
		debugLogger.info("outputDir: "+ this.outputDir);		
		debugLogger.info("queryFilePath: "+this.queryFilePath);
		debugLogger.info("resultFilePath: "+ this.resultFilePath);
		debugLogger.info("statusFilePath: "+this.statusFilePath);

		reportLogger.info("Job ID: " + this.jobID);
		reportLogger.info("Job Name: " + this.jobName);
				
	}
	
	private static void usage() {
		System.err.println("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		debugLogger.error("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		reportLogger.error("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile mongoDBhost mongoDBport mongoDBName mongoDBCollection");		
		
		System.exit(1);
	}

	private void establishHiveConnection()  throws SQLException{
		
		try {
			Class.forName(driverName);
			String connectionURL = "jdbc:hive2://" + hiveHost + "/" + hiveDBName;
			
			debugLogger.debug("Login TimeOut to Hive Server set to : "+ HIVE_ESTABLISH_CONNECTION_TIMEOUT + " seconds");
			DriverManager.setLoginTimeout(HIVE_ESTABLISH_CONNECTION_TIMEOUT);
			
			debugLogger.debug("Connecting to Hive Server with parameters - URL:- '" + connectionURL + "' , hiveUser: '"+hiveUser+"'");

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

			this.mongoExecutor.closeConnection();
			debugLogger.debug("Closed the MongoDB connection");

			e.printStackTrace();	
			System.exit(1);
		}
		
	}

	private String readFile(String path) throws IOException {
		debugLogger.debug("Reading the Query File : "+path);
		reportLogger.debug("Reading the Query");
		byte[] encoded = Files.readAllBytes(Paths.get(path));
		String query = new String(encoded, Charset.defaultCharset());
		query = query.replaceAll("\r", "").replaceAll("\n", " ").replaceAll(";", "");
		return query;
	}
	
	private void executeQuery(String sql)   throws IOException, SQLException {
		
		
		try {
			
			debugLogger.debug("Executing Query : "+sql);
			
			this.writerLog.println("JobID : " + this.jobID);
			this.writerLog.println("Running : " + sql);
			
			this.res = stmt.executeQuery(sql);
			this.jobStatus = JobStatus.SUCCESS;
			
			debugLogger.debug("Query Execution Completed");
			reportLogger.debug("Query Execution Completed");
			
		
		} catch (Exception e){
			debugLogger.error("Exception executing Hive Query : ", e);
			reportLogger.error("Exception executing Hive Query : ", e);
			
			this.writerLog.println("Job Failed");
			
			this.occurredException = e;
			this.occurredException.printStackTrace(this.writerLog);
			this.jobStatus = JobStatus.FAILED;
			this.cleanUp();
		} 
				
	}
	
	private void createOutputDirectory(){
		String dirname = this.outputDir;
	      File d = new File(dirname);
	      // Create directory now.
	      d.mkdirs();
	      debugLogger.debug("Created Output Directory : " + dirname );
	}

	private void exportResult() throws SQLException, FileNotFoundException, UnsupportedEncodingException{
		
		debugLogger.debug("Exporting Results to File");
		
		PrintWriter writerResult = new PrintWriter(this.resultFilePath, "UTF-8");
		
		switch(this.jobStatus) {
		
			case FAILED:
				debugLogger.debug("Exporting "+getJobStatusValue(this.jobStatus)+" to Result File");
				writerResult.println(getJobStatusValue(this.jobStatus));
				break;
			
			case SUCCESS:
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
				break;
			
		}
		
		writerResult.close();
		debugLogger.debug("Export to Result File completed : "+this.resultFilePath);
		reportLogger.info("Export to Result File completed");
		
		this.writerLog.println("Output written :"+this.resultFilePath);
	}

	private void copyQueryFileToOuputDir() throws IOException {
		
		File sourceFile = new File(this.queryFilePath);
		File destFile = new File(this.outputDir + "/sql.txt");
		Files.copy(sourceFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
		debugLogger.debug("File Copy completed from "+sourceFile+" to "+destFile);
	}

	private void updateStatus() throws FileNotFoundException, UnsupportedEncodingException {
		
		// Update the Status File
		PrintWriter writerStatus = new PrintWriter(this.statusFilePath, "UTF-8");
		this.writerLog.println(getJobStatusValue(this.jobStatus));
		
		debugLogger.debug("Updated the Status File to "+getJobStatusValue(this.jobStatus));
		
		writerStatus.print(getJobStatusValue(this.jobStatus));
		if (this.jobStatus == JobStatus.FAILED){
			this.occurredException.printStackTrace(this.writerLog);
			debugLogger.debug("Job Failed! Updated the Status File with Error Details : ", this.occurredException);
		}
		writerStatus.close();
		

		// Update the Status in MongoDB
		this.mongoExecutor.updateStatusDocument(this.jobID, getJobStatusValue(this.jobStatus) );
		debugLogger.debug("Updated the Status of JobID - "+this.jobID+" to "+getJobStatusValue(this.jobStatus)+" in MongoDB");
	
	}

	private void cleanUp(){
		this.writerLog.close();	
	}
	
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
	
	public static void main(String[] args)  throws SQLException, IOException {
		
		reportLogger.info("Beginning Execution of Hive Executor Java Client");
		debugLogger.info("Beginning Execution of Hive Executor Java Client");
		
		
		if (args.length != 11) {
			debugLogger.warn("Number of arguments != 11");
			debugLogger.debug("Arguments: "+ Arrays.toString(args));
			usage();
		}
		
		HiveExecutor hiveExecObj = new HiveExecutor(args);
		
		hiveExecObj.updateStatus();
		
		hiveExecObj.printMetaData();
		
		hiveExecObj.establishHiveConnection();
		String sql = hiveExecObj.readFile(hiveExecObj.queryFilePath);
		
		hiveExecObj.createOutputDirectory();
		
		hiveExecObj.jobStatus = JobStatus.IN_PROGRESS;
		hiveExecObj.updateStatus();
		
		hiveExecObj.executeQuery(sql);
				
		hiveExecObj.exportResult();

		hiveExecObj.updateStatus();
//		//hiveExecObj.copyQueryFileToOuputDir();
		hiveExecObj.cleanUp();
				
	}

	
}
