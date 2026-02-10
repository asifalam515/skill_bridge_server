import { prisma } from "../../lib/prisma";

const defaultCategories = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Programming",
  "Web Development",
  "Data Science",
  "English",
  "Spanish",
  "French",
  "History",
  "Geography",
  "Economics",
  "Business",
  "Music",
  "Art",
  "Test Preparation",
  "SAT",
  "IELTS",
];

async function seedCategories() {
  console.log("Seeding categories...");

  for (const categoryName of defaultCategories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });
    console.log(`✓ ${categoryName}`);
  }

  console.log(" Categories seeded successfully!");
}

// Run the seed function
seedCategories()
  .catch((error) => {
    console.error("Error seeding categories:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
