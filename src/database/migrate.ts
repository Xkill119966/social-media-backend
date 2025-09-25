import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

class DatabaseMigrator {
  private connection: mysql.Connection | null = null;

  async connect(): Promise<void> {
    try {
      // Connect without specifying database first to create it
      const connectionConfig: mysql.ConnectionOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        charset: "utf8mb4",
        multipleStatements: true,
      };

      // Only add SSL config if enabled
      if (process.env.DB_SSL === "true") {
        connectionConfig.ssl = {
          rejectUnauthorized: false,
        };
      }

      this.connection = await mysql.createConnection(connectionConfig);
      console.log("✅ Connected to MySQL server");
    } catch (error) {
      console.error(
        "❌ Failed to connect to MySQL server:",
        (error as Error).message
      );
      throw error;
    }
  }

  async createDatabase(): Promise<void> {
    if (!this.connection) {
      throw new Error("No database connection");
    }
    console.log("process.env.DB_NAME", process.env.DB_NAME);
    try {
      const dbName = process.env.DB_NAME;
      if (!dbName) {
        throw new Error("DB_NAME environment variable is not set");
      }

      // Create database if it doesn't exist
      await this.connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
      );
      console.log(`✅ Database '${dbName}' created or already exists`);

      // Use the database
      await this.connection.query(`USE \`${dbName}\``);
      console.log(`✅ Using database '${dbName}'`);
    } catch (error) {
      console.error("❌ Failed to create database:", (error as Error).message);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    if (!this.connection) {
      throw new Error("No database connection");
    }

    try {
      // Read and execute schema
      const schemaPath = path.join(__dirname, "schema.sql");

      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }

      const schema = fs.readFileSync(schemaPath, "utf8");
      console.log("📄 Reading schema file...");

      // More robust parsing of SQL statements
      const statements: string[] = [];
      let currentStatement = "";

      const lines = schema.split("\n");
      for (const line of lines) {
        // Skip comment lines
        if (line.trim().startsWith("--")) {
          continue;
        }

        currentStatement += line + "\n";

        // If line ends with semicolon, we have a complete statement
        if (line.trim().endsWith(";")) {
          const trimmedStatement = currentStatement.trim();
          if (trimmedStatement.length > 0) {
            statements.push(trimmedStatement);
          }
          currentStatement = "";
        }
      }

      // Add any remaining statement (in case it doesn't end with semicolon)
      if (currentStatement.trim().length > 0) {
        statements.push(currentStatement.trim());
      }

      console.log(`🔄 Executing ${statements.length} SQL statements...`);

      // Execute all statements in order
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim().length === 0) continue;

        try {
          await this.connection.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.error(
            `❌ Failed to execute statement ${i + 1}:`,
            statement.substring(0, 100) + "..."
          );
          throw error;
        }
      }

      console.log("✅ All migrations completed successfully!");
    } catch (error) {
      console.error("❌ Migration failed:", (error as Error).message);
      throw error;
    }
  }

  private extractTableName(statement: string): string {
    const match = statement.match(/CREATE TABLE\s+(\w+)/i);
    return match ? match[1] : "unknown";
  }

  private extractIndexName(statement: string): string {
    const match = statement.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)/i);
    return match ? match[1] : "unknown";
  }

  async checkTables(): Promise<void> {
    if (!this.connection) {
      throw new Error("No database connection");
    }

    try {
      const [tables] = await this.connection.query("SHOW TABLES");
      console.log("\n📋 Database summary:");
      console.log(`   Database: ${process.env.DB_NAME}`);
      console.log(`   Tables created: ${(tables as any[]).length}`);

      if ((tables as any[]).length > 0) {
        console.log("   Table list:");
        (tables as any[]).forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`     ${index + 1}. ${tableName}`);
        });

        // Check table structures
        console.log("\n🔍 Verifying table structures...");
        for (const table of tables as any[]) {
          const tableName = Object.values(table)[0] as string;
          try {
            const [columns] = await this.connection.query(
              `DESCRIBE ${tableName}`
            );
            console.log(
              `   ✅ ${tableName}: ${(columns as any[]).length} columns`
            );
          } catch (error) {
            console.log(`   ❌ ${tableName}: structure check failed`);
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to check tables:", (error as Error).message);
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log("✅ Database connection closed");
    }
  }

  async validateEnvironment(): Promise<void> {
    const requiredEnvVars = ["DB_HOST", "DB_USER", "DB_NAME"];
    const missingVars: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }

    console.log("✅ Environment variables validated");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
  }

  async checkExistingTables(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }

    try {
      const [tables] = await this.connection.query("SHOW TABLES");
      const tableCount = (tables as any[]).length;

      if (tableCount > 0) {
        console.log(`⚠️  Found ${tableCount} existing tables in database`);
        const tableNames = (tables as any[]).map(
          (table) => Object.values(table)[0]
        );
        console.log(`   Tables: ${tableNames.join(", ")}`);
        return true;
      }

      return false;
    } catch (error) {
      // Database might not exist yet, which is fine
      return false;
    }
  }
}

async function runMigration(): Promise<void> {
  const migrator = new DatabaseMigrator();

  try {
    console.log("🚀 Starting database migration...\n");

    // Validate environment
    await migrator.validateEnvironment();

    // Connect to MySQL server
    await migrator.connect();

    // Create database
    await migrator.createDatabase();

    // Check if tables already exist
    const hasExistingTables = await migrator.checkExistingTables();
    if (hasExistingTables) {
      console.log("ℹ️  Migration will update existing database structure");
    }

    // // Run migrations
    await migrator.runMigrations();

    // // Check created tables
    // await migrator.checkTables();

    console.log("\n🎉 Database migration completed successfully!");
    console.log("💡 You can now start the application with: npm run dev");
    console.log("💡 To add sample data, run: npm run seed");
  } catch (error) {
    console.error("\n💥 Migration failed:", (error as Error).message);
    console.log("\n🔧 Troubleshooting tips:");
    console.log("   1. Check your .env file has correct database credentials");
    console.log("   2. Ensure MySQL server is running");
    console.log("   3. Verify the database user has CREATE privileges");
    console.log("   4. Check the schema.sql file exists and is valid");
    console.log("   5. Try running: npm run db:reset && npm run migrate");
    process.exit(1);
  } finally {
    await migrator.close();
  }
}

export { runMigration };

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}
