/**
 **********************************************************************************************************************************************************************
 * @author gmalu (Ghanshyam Malu)
 * June 17, 2015
 * 
 * MongoDB Java Client
 * Updates the status of the given JobID in the MongoDB database.
 * 
 ********************************************************************************************************************************************************************** 
 */

import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.apache.log4j.Logger;
import org.bson.Document;

/**
 * Core class of the MongoDB Java Client
 * @author gmalu
 *
 */
public class MongoExecutor {
	private MongoClient mongoClient;
	private MongoDatabase mongoDB;
	private MongoCollection mongoCollection;
	
	//	Get the Logger information for Log4j
    static final Logger debugLogger = Logger.getLogger("debugLogger");

	/**
	 * Establish MongoDB connection
	 * @param mongoHostAddress
	 * @param port
	 */
	MongoExecutor(String mongoHostAddress, int port) {
		this.mongoClient = new MongoClient(mongoHostAddress, port);
	}
	
	/**
	 * Get the Database and Collection
	 * @param database
	 * @param collection
	 */
	public void connectDBCollection(String database, String collection) {
		debugLogger.debug("Getting the MongoDB handle for the DB: '" + database + "' and Collection: '" + collection +"'"); 
		this.mongoDB = mongoClient.getDatabase(database);
		this.mongoCollection = this.mongoDB.getCollection(collection);
	}

	/**
	 * Update the Job Status and Updated Timestamp of the given JobID
	 * @param jobId
	 * @param status
	 */
	public void updateStatusDocument(String jobID, String status) {
		debugLogger.debug("Updating the Status and UpdatedTimeStamp fields of JobID document:" + jobID);
		// 
		Document query = new Document("_id", jobID);
		Document update =new Document("$set", new Document("JobRunStatus", status))
													.append("$currentDate", new Document("UpdatedTimeStamp", true));										
		
		this.mongoCollection.updateOne(query,update);
		
	}

	/**
	 * Close the MongoDB connection
	 */
	public void closeConnection() {
		debugLogger.debug("Closing the MongoDB connection");
		this.mongoClient.close();
	}

}
