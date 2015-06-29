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
	private String outputDir;
	private String resultFilePath;
	private ResultSet res;

	//  Hive Connection Login Timeout
	public static int HIVE_ESTABLISH_CONNECTION_TIMEOUT = 10; //seconds

	//	Get the Logger information for Log4j
	static final Logger debugLogger = Logger.getLogger("debugLogger");
	static final Logger reportLogger = Logger.getLogger("reportLogger");

	/**
	 * Initializing the class parameters from the program arguments
	 * @param args
	 * @throws IOException
	 */
	HiveExecutor(String[] args) throws IOException {
		debugLogger.debug("Initializing the class parameters from the arguments");

		this.jobID = args[0];
		this.jobName = args[1];
		this.outputDir = args[2];
		this.hiveUser = args[3];
		this.hiveHost = args[4];
		this.hiveDBName = args[5];
		this.queryFilePath = args[6];
		this.resultFilePath = this.outputDir + "/result.txt";

	}

	/**
	 * Prints the Job Metadata onto the Logger
	 */
	private void printMetaData() {

		debugLogger.info("Job ID: " + this.jobID);
		debugLogger.info("Job Name: " + this.jobName);
		debugLogger.info("Output Data Directory: " + this.outputDir);
		debugLogger.info("Query File Path: " + this.queryFilePath);
		debugLogger.info("Result File Path: " + this.resultFilePath);

		reportLogger.info("Job ID: " + this.jobID);
		reportLogger.info("Job Name: " + this.jobName);

	}

	/**
	 * Displays the Program Usage
	 */
	private static void usage() {
		System.err.println("Usage : java " + HiveExecutor.class.getName() + " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile");

		debugLogger.error("Usage : java " + HiveExecutor.class.getName() + " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile");

		reportLogger.error("Usage : java " + HiveExecutor.class.getName() + " jobID outputDataDir hiveUserName hiveHost dbName hiveQueryFile");

		System.exit(1);
	}

	/**
	 * Establish Hive Connection
	 * @throws SQLException
	 */
	private void establishHiveConnection() throws SQLException {

		try {
			Class.forName(driverName);
			String connectionURL = "jdbc:hive2://" + hiveHost + "/" + hiveDBName;

			debugLogger.debug("Login TimeOut to Hive Server set to : " + HIVE_ESTABLISH_CONNECTION_TIMEOUT + " seconds");
			DriverManager.setLoginTimeout(HIVE_ESTABLISH_CONNECTION_TIMEOUT);

			debugLogger.debug("Connecting to Hive Server with parameters - URL:- '" + connectionURL + "' , hiveUser: '" + hiveUser + "'");
			reportLogger.debug("Connecting to Hive Server with parameters - URL:- '" + connectionURL + "' , hiveUser: '" + hiveUser + "'");

			this.con = DriverManager.getConnection(connectionURL, hiveUser, "");
			// Connection con = DriverManager.getConnection("jdbc:hive2://172.16.226.129:10000/default", "hive", "");
			this.stmt = con.createStatement();

		} catch (Exception e) {
			debugLogger.error("Exception Establishing Hive Connection : ", e);
			reportLogger.error("Exception Establishing Hive Connection : ", e);

			e.printStackTrace();

			debugLogger.error(this.jobID + " - JOB_FAILED");
			reportLogger.error(this.jobID + " - JOB_FAILED");

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

		debugLogger.debug("Reading the Query File : " + path);
		reportLogger.debug("Reading the Query");

		String query = "";

		try {
			byte[] encoded = Files.readAllBytes(Paths.get(path));
			query = new String(encoded, Charset.defaultCharset());
			query = query.replaceAll("\r", "").replaceAll("\n", " ").replaceAll(";", "");

		} catch (Exception e) {
			debugLogger.error("Exception reading Query file : ", e);
			reportLogger.error("Exception reading Query file : ", e);

			e.printStackTrace();

			debugLogger.error(this.jobID + " - JOB_FAILED");
			reportLogger.error(this.jobID + " - JOB_FAILED");

			System.exit(1);

		}

		return query;
	}

	/**
	 * Execute the Hive Query
	 * @param sql
	 * @throws IOException
	 * @throws SQLException
	 */
	private void executeQuery(String sql) throws IOException, SQLException {


		try {

			debugLogger.debug("Executing Query : " + sql);
			reportLogger.debug("Executing Query : " + sql);

			this.res = stmt.executeQuery(sql);

			debugLogger.debug("Query Execution Completed");
			reportLogger.debug("Query Execution Completed");


		} catch (Exception e) {
			debugLogger.error("Exception executing Hive Query : ", e);
			reportLogger.error("Exception executing Hive Query : ", e);

			System.exit(1);
		}

	}


	/**
	 * Export the Query Results to the Result File
	 * @throws SQLException
	 * @throws FileNotFoundException
	 * @throws UnsupportedEncodingException
	 */
	private void exportResult() throws SQLException, FileNotFoundException, UnsupportedEncodingException {

		try {
			debugLogger.debug("Exporting Results to File");
			reportLogger.info("Exporting Results to File");

			PrintWriter writerResult = new PrintWriter(this.resultFilePath, "UTF-8");

			ResultSetMetaData rsmd;
			boolean headerPrinted = false;

			while (this.res.next()) {
				rsmd = this.res.getMetaData();
				int numOfCols = rsmd.getColumnCount();

				if (!headerPrinted) {
					debugLogger.debug("Printing Column Headers to Result File");
					for (int i = 1; i <= numOfCols; i++) {
						writerResult.print(rsmd.getColumnName(i).toUpperCase());
						if (i != numOfCols) {
							writerResult.print("\t");
						}
					}
					writerResult.println();
					headerPrinted = true;
				}


				for (int i = 1; i <= numOfCols; i++) {
					writerResult.print(this.res.getString(i));
					if (i != numOfCols) {
						writerResult.print("\t");
					}
				}
				writerResult.println();
			}

			writerResult.close();

			debugLogger.debug("Export to Result File completed : " + this.resultFilePath);
			reportLogger.info("Export to Result File completed");
		} catch (Exception e) {
			debugLogger.error("Exception Exporting Results : ", e);
			reportLogger.error("Exception Exporting Results : ", e);
			System.exit(1);
		}

	}

	/**
	 * Main program
	 * @param args
	 * @throws SQLException
	 * @throws IOException
	 */
	public static void main(String[] args) throws SQLException, IOException {

		// Validate the number of arguments supplied
		if (args.length != 7) {
			debugLogger.warn("Number of arguments != 7");
			debugLogger.debug("Arguments: " + Arrays.toString(args));
			usage();
		}

		reportLogger.info("## Beginning Execution of Hive Executor Java Client ##");
		debugLogger.info("## Beginning Execution of Hive Executor Java Client ##");

		// Create new object and initialize the program parameters using the arguments
		HiveExecutor hiveExecObj = new HiveExecutor(args);

		// Print the Job metadata
		hiveExecObj.printMetaData();

		// Establish Hive Connection
		hiveExecObj.establishHiveConnection();

		// Read the Hive Query File
		String sql = hiveExecObj.readFile(hiveExecObj.queryFilePath);

		// Execute the Hive Query
		hiveExecObj.executeQuery(sql);

		// Export the Hive Results to the Result File
		hiveExecObj.exportResult();

		reportLogger.info("## Ending Execution of Hive Executor Java Client ##");
		debugLogger.info("## Ending Execution of Hive Executor Java Client ##");

	}

}