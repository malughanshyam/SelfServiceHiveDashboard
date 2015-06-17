/**
 **********************************************************************************************************************************************************************
 * @author gmalu (Ghanshyam Malu)
 * June 17, 2015
 * 
 * Hive Executor Java Client without MongoDB
 * Executes the given Hive Query File on the Hive Server and exports the results to the Output File
 *
 * Usage : java HiveExecutor <jobID> <outputDataDir> <hiveUserName> <hiveHost> <dbName> <hiveQueryFile>
 *
 * ------------------------------------------------------------------------------
 * NOTE : This program is NOT USED by the Self Service Hive Dashboard Website.   	
 * ------------------------------------------------------------------------------
 *
 ********************************************************************************************************************************************************************** 
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
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public class HiveExecutorWithoutMongoDB {
	private static String driverName = "org.apache.hive.jdbc.HiveDriver";
	private String jobID;
	private String hiveHost;
	private String dbName;
	private String hiveUser;
	private String queryFilePath;
	private Connection con;
	private Statement stmt;
//	private String jobStatus;
	private String statusFilePath;
	private String logFilePath;
	private String outputDir ;
	private String outputDataDir;
	private String resultFilePath;
	private ResultSet res;
	private Exception occurredException;
	private PrintWriter writerLog;

	public static int HIVE_ESTABLISH_CONNECTION_TIMEOUT = 10 ; //seconds
	
	public enum JobStatus {
		NOT_STARTED, SUCCESS, FAILED, IN_PROGRESS
	}
 
	private JobStatus jobStatus;
	
	HiveExecutorWithoutMongoDB (String [] args) throws IOException{	
		this.jobID = args[0];
		//this.outputDir = "/Users/gmalu/Documents/Project/HiveDashboard/data/"+this.jobID;
		//this.outputDataDir = args[1];
		//this.outputDir = this.outputDataDir +this.jobID;
		this.outputDir = args[1];
		this.hiveUser = args[2];
		this.hiveHost = args[3];
		this.dbName = args[4];
		this.queryFilePath = args[5];
		this.resultFilePath = this.outputDir +"/result.txt";
		this.statusFilePath = this.outputDir +"/status.txt";
		this.logFilePath = this.outputDir +"/log.txt";
		this.jobStatus = JobStatus.NOT_STARTED;
		//this.writerLog = new PrintWriter(this.logFilePath, "UTF-8");		
		this.writerLog = new PrintWriter(new FileWriter(this.logFilePath, true)); 
		
	}
	
	private void printMetaData(){
	
		this.writerLog.println("Job ID: " + this.jobID);
		this.writerLog.println("outputDataDir: "+ this.outputDataDir);
		this.writerLog.println("outputDir: "+ this.outputDir);		
		this.writerLog.println("queryFilePath: "+this.queryFilePath);
		this.writerLog.println("resultFilePath: "+ this.resultFilePath);
		this.writerLog.println("statusFilePath: "+this.statusFilePath);
		this.writerLog.println("\n");
				
	}
	


	private static void usage() {
		System.err.println("Usage : java " + HiveExecutor.class.getName()
				+ " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile");
		System.exit(1);
	}

	private void establishConnection()  throws SQLException{
		
		try {
			Class.forName(driverName);
		}
		catch (ClassNotFoundException e) {
			e.printStackTrace();
			System.exit(1);
		}
		
		String connectionURL = "jdbc:hive2://" + hiveHost + "/" + dbName;
		DriverManager.setLoginTimeout(HIVE_ESTABLISH_CONNECTION_TIMEOUT);
		this.con = DriverManager.getConnection(connectionURL, hiveUser, "");
		// Connection con = DriverManager.getConnection("jdbc:hive2://172.16.226.129:10000/default", "hive", "");
		this.stmt = con.createStatement();
	}

	private String readFile(String path) throws IOException {
		byte[] encoded = Files.readAllBytes(Paths.get(path));
		String query = new String(encoded, Charset.defaultCharset());
		query = query.replaceAll("\r", "").replaceAll("\n", " ").replaceAll(";", "");
		return query;
	}
	
	private void executeQuery(String sql)   throws IOException, SQLException {
		
		
		try {
			this.writerLog.println("JobID : " + this.jobID);
			this.writerLog.println("Running : " + sql);
			
			this.res = stmt.executeQuery(sql);
			//this.jobStatus = "SUCCESS";
			this.jobStatus = JobStatus.SUCCESS;
		
		} catch (Exception e){
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
	}

	private void exportResult() throws SQLException, FileNotFoundException, UnsupportedEncodingException{
		
		PrintWriter writerResult = new PrintWriter(this.resultFilePath, "UTF-8");
		
		switch(this.jobStatus) {
		
			case FAILED:
				writerResult.println(getJobStatusValue(this.jobStatus));
				break;
			
			case SUCCESS:
				ResultSetMetaData rsmd;
				boolean headerPrinted = false;
				
				while (this.res.next()) {
					rsmd = this.res.getMetaData();
					int numOfCols = rsmd.getColumnCount();
					
					if (!headerPrinted){
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
		this.writerLog.println("Output written :"+this.resultFilePath);
	}

	private void copyQueryFileToOuputDir() throws IOException {
		
		File sourceFile = new File(this.queryFilePath);
		File destFile = new File(this.outputDir + "/sql.txt");
		Files.copy(sourceFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
		
	}

	private void updateStatusFile() throws FileNotFoundException, UnsupportedEncodingException {
		PrintWriter writerStatus = new PrintWriter(this.statusFilePath, "UTF-8");
		
		this.writerLog.println(getJobStatusValue(this.jobStatus));
		writerStatus.print(getJobStatusValue(this.jobStatus));
		if (this.jobStatus == JobStatus.FAILED){
			this.occurredException.printStackTrace(this.writerLog);
		}
		writerStatus.close();
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
		
		if (args.length != 6) {
			usage();
		}

		HiveExecutorWithoutMongoDB hiveExecObj = new HiveExecutorWithoutMongoDB(args);
		
		hiveExecObj.updateStatusFile();
		
		hiveExecObj.printMetaData();
		
		hiveExecObj.establishConnection();
		String sql = hiveExecObj.readFile(hiveExecObj.queryFilePath);
		
		hiveExecObj.createOutputDirectory();
		
		hiveExecObj.jobStatus = JobStatus.IN_PROGRESS;
		hiveExecObj.updateStatusFile();
		
		hiveExecObj.executeQuery(sql);
				
		hiveExecObj.exportResult();
	
		hiveExecObj.updateStatusFile();

		//hiveExecObj.copyQueryFileToOuputDir();

		hiveExecObj.cleanUp();
				
	}
}
