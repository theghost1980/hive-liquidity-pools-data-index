import fs from "fs";
import path from "path";

// Function to ensure the data_tracker directory exists
function ensureDataDirectoryExists(subDirName: string) {
  const mainDir = path.join(__dirname, "data");
  const subDir = path.join(mainDir, subDirName);

  try {
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
      console.log(`Directories created successfully at: ${subDir}`);
    }
  } catch (err: any) {
    console.error(`Error creating directories: ${err.message}`);
  }
}

// Function to write data to a file within the data_tracker directory
function writeDataToFile(fileName: string, subDir: string, data: any) {
  const fixedSubDirName = subDir.replace(":", "_"); // Ensure the sub folder's name do not contains ":"
  ensureDataDirectoryExists(fixedSubDirName); // Ensure the directory exists

  const dirPath = path.join(__dirname, "data", fixedSubDirName);
  const filePath = path.join(dirPath, fileName);

  console.log("About to save into ", { fixedSubDirName, filePath, fileName });

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
      encoding: "utf8",
    });
    console.log(`Data written to ${filePath}`);
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

// Function to read data from a file within the data_tracker directory
// function readDataFromFile(
//   fileName: string,
//   enc: BufferEncoding
// ): string | null {
//   ensureDataDirectoryExists(); // Ensure the directory exists
//   const filePath = path.join(dataDir, fileName);
//   try {
//     const data = fs.readFileSync(filePath, { encoding: enc });
//     console.log(`Data read from ${filePath}`);
//     return data;
//   } catch (error) {
//     console.error("Error reading file:", error);
//     return null;
//   }
// }

// function renameFile(oldFileName: string, newFileName: string): void {
//   ensureDataDirectoryExists(); // Ensure the directory exists
//   const oldFilePath = path.join(dataDir, oldFileName);
//   const newFilePath = path.join(dataDir, newFileName);

//   try {
//     fs.renameSync(oldFilePath, newFilePath);
//     console.log(`Renamed ${oldFileName} to ${newFileName}`);
//   } catch (error) {
//     console.error(
//       `Error renaming file ${oldFileName} to ${newFileName}:`,
//       error
//     );
//   }
// }

export const FileUtils = {
  ensureDataDirectoryExists,
  writeDataToFile,
  //   readDataFromFile,
  //   renameFile,
};
