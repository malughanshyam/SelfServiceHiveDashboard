/**
 * @author gmalu
 *
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
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public class HiveExecutor {
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
	private String outputDir ;
	private String outputDataDir;
	private String resultFilePath;
	private ResultSet res;
	private Exception occurredException;
	
	public enum JobStatus {
		NOT_STARTED, SUCCESS, FAILED, IN_PROGRESS
	}
 
	private JobStatus jobStatus;
	
	HiveExecutor (String [] args){	
		this.jobID = args[0];
		//this.outputDir = "/Users/gmalu/Documents/Project/HiveDashboard/data/"+this.jobID;
		this.outputDataDir = args[1];
		this.outputDir = this.outputDataDir +this.jobID;
		this.hiveUser = args[2];
		this.hiveHost = args[3];
		this.dbName = args[4];
		this.queryFilePath = args[5];
		//this.jobStatus = "NOT STARTED";
		this.resultFilePath = this.outputDir +"/result.txt";
		this.statusFilePath = this.outputDir +"/status.txt";
		this.jobStatus = JobStatus.NOT_STARTED;
	}
	
	private void printMetaData(){
	
		System.out.println("Job ID: " + this.jobID);
		System.out.println("outputDataDir: "+ this.outputDataDir);
		System.out.println("outputDir: "+ this.outputDir);		
		System.out.println("queryFilePath: "+this.queryFilePath);
		System.out.println("resultFilePath: "+ this.resultFilePath);
		System.out.println("statusFilePath: "+this.statusFilePath);
		System.out.println("\n");
				
	}
	
	public static void main(String[] args)  throws SQLException, IOException {
		
		if (args.length != 6) {
			usage();
		}

		HiveExecutor hiveExecObj = new HiveExecutor(args);
		hiveExecObj.printMetaData();
		
		hiveExecObj.establishConnection();
		String sql = hiveExecObj.readFile(hiveExecObj.queryFilePath);
		
		hiveExecObj.createOutputDirectory();
		
		//hiveExecObj.jobStatus = "IN PROGRESS";
		hiveExecObj.jobStatus = JobStatus.IN_PROGRESS;
		hiveExecObj.updateStatusFile();
		
		hiveExecObj.executeQuery(sql);
				
		hiveExecObj.exportResult();
		
/*		if ( hiveExecObj.jobStatus == JobStatus.SUCCESS){			
			hiveExecObj.exportResult();
		}
*/
		hiveExecObj.updateStatusFile();
		hiveExecObj.copyQueryFileToOuputDir();
				
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
			System.out.println("JobID : " + this.jobID);
			System.out.println("Running : " + sql);
			
			this.res = stmt.executeQuery(sql);
			//this.jobStatus = "SUCCESS";
			this.jobStatus = JobStatus.SUCCESS;
		
		} catch (Exception e){
			System.out.println("Job Failed");
			this.occurredException = e;
			//this.jobStatus = "FAILED";
			this.jobStatus = JobStatus.FAILED;
		} 
				
	}
	
	private void createOutputDirectory(){
		String dirname = this.outputDir;
	      File d = new File(dirname);
	      // Create directory now.
	      d.mkdirs();
	}

	private void exportResult() throws SQLException, FileNotFoundException, UnsupportedEncodingException{
		
		PrintWriter writer = new PrintWriter(this.resultFilePath, "UTF-8");
		
		switch(this.jobStatus) {
		
			case FAILED:
				writer.println(getJobStatusValue(this.jobStatus));
				break;
			
			case SUCCESS:
				ResultSetMetaData rsmd;
				while (this.res.next()) {
					rsmd = this.res.getMetaData();
					int numOfCols = rsmd.getColumnCount();
					for (int i = 1; i <= numOfCols; i++) {	
						writer.print(this.res.getString(i) + "\t");
					}
					writer.println();
				}
				break;
			
		}
		
		writer.close();
		System.out.println("Output written :"+this.resultFilePath);
	}

	private void copyQueryFileToOuputDir() throws IOException {
		
		File sourceFile = new File(this.queryFilePath);
		File destFile = new File(this.outputDir + "/sql.txt");
		Files.copy(sourceFile.toPath(), destFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
		
	}

	private void updateStatusFile() throws FileNotFoundException, UnsupportedEncodingException {
		PrintWriter writer = new PrintWriter(this.statusFilePath, "UTF-8");
		writer.println(getJobStatusValue(this.jobStatus));
		if (this.jobStatus == JobStatus.FAILED){
			this.occurredException.printStackTrace(writer);
		}
		writer.close();
	}
	
	public static String getJobStatusValue(JobStatus jobStatus){	
		
		switch (jobStatus){
		
		  case SUCCESS:     
			  return "SUCCESS";
			  
		  case NOT_STARTED:   
			  return "NOT_STARTED";
			  
		  case FAILED:  
			  return "FAILED";
			  
		  case IN_PROGRESS:    
			  return "IN_PROGRESS";
			  
		  default:      
			  return null;
		 }
	 }
	  
	public static void printColHeaders(ResultSet res) throws SQLException {
		ResultSetMetaData rsmd;
		while (res.next()) {
			rsmd = res.getMetaData();
			int numOfCols = rsmd.getColumnCount();
			for (int i = 1; i <= numOfCols; i++) {
				System.out.print(rsmd.getColumnName(i) + "\t");
			}
			System.out.println();
			// System.out.println(String.valueOf(res));
		}
	}
}
