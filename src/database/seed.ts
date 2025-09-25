import database from "../config/database";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { PasswordHelper } from "../utils/passwordHelper";

class DatabaseSeeder {
  async seedUsers(): Promise<void> {
    console.log("🌱 Seeding users...");

    const users = [
      {
        name: "Demo User",
        email: "demo@example.com",
        password: "demo123!",
      },
    ];

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await User.findByEmail(userData.email);
        if (!existingUser) {
          await User.create(userData);
          console.log(`✅ Created user: ${userData.email}`);
        } else {
          console.log(`⏭️ User already exists: ${userData.email}`);
        }
      } catch (error) {
        console.error(
          `❌ Failed to create user ${userData.email}:`,
          (error as Error).message
        );
      }
    }
  }

  async run(): Promise<void> {
    try {
      console.log("🚀 Starting database seeding...\n");

      // Connect to database
      await database.connect();

      // Run seeders in order
      await this.seedUsers();

      console.log("\n🎉 Database seeding completed successfully!");
      console.log("💡 You can now test the API with sample data");
    } catch (error) {
      console.error("\n💥 Seeding failed:", (error as Error).message);
      process.exit(1);
    } finally {
      await database.close();
    }
  }
}

// Run seeder if this file is executed directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.run();
}

export default DatabaseSeeder;
