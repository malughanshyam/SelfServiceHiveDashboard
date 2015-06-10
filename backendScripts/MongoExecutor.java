import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class MongoExecutor {
	private MongoClient mongoClient;
	private MongoDatabase mongoDB;
	private MongoCollection mongoCollection;

	MongoExecutor(String mongoHostAddress, int port) {
		// Establish connection
		this.mongoClient = new MongoClient(mongoHostAddress, port);
	}

	public void connectDBCollection(String database, String collection) {

		// Connecting to the DB and Collection
		this.mongoDB = mongoClient.getDatabase(database);
		this.mongoCollection = this.mongoDB.getCollection(collection);
	}

	public void updateStatusDocument(String jobId, String status) {

		// Update the Status and UpdatedTimeStamp fields of JobID document
		Document query = new Document("_id", jobId);
		Document update =new Document("$set", new Document("Status", status))
													.append("$currentDate", new Document("UpdatedTimeStamp", true));										
		
		this.mongoCollection.updateOne(query,update);
		
	}

	public void closeConnection() {
		this.mongoClient.close();
	}

}
