// import fs from "fs";
// import mongoose from "mongoose";
// import HSNMaster from "./models/hsnMasterModel.js";

// const rawData = fs.readFileSync("./data/HSN_SAC.json", "utf-8");
// const jsonData = JSON.parse(rawData);

// export async function importHSNData() {
//   try {
//     const hsnArray = jsonData.HSN_MSTR;
//     await HSNMaster.insertMany(hsnArray);
//     console.log("HSN data imported successfully");
//   } catch (err) {
//     console.error("Error importing data:", err);
//   }
// }

// // importHSNData();

// scripts/importIndiaData.js
// import fs from "fs";
// import mongoose from "mongoose";

// import { Country, State, City, Pincode } from "./models/locationModel.js";
// const jsonData = fs.readFileSync("./data/indian_pincode.json", "utf-8");
// const indiaData = JSON.parse(jsonData);

// ------------------ 3. Import Function ------------------
// export const importIndiaData = async () => {
//   try {
//     // 1. Create/find India
//     let country = await Country.findOne({ name: "India" });
//     if (!country) {
//       country = await Country.create({ name: "India" });
//       console.log("✅ Country 'India' created");
//     } else {
//       console.log("ℹ️ Country 'India' already exists");
//     }

//     // 2. Create/find Gujarat state
//     let state = await State.findOne({ name: "Gujarat", country: country._id });
//     if (!state) {
//       state = await State.create({ name: "Gujarat", country: country._id });
//       console.log("✅ State 'Gujarat' created");
//     } else {
//       console.log("ℹ️ State 'Gujarat' already exists");
//     }

//     // 3. Gujarat cities from indiaData
//     const gujaratCities = indiaData["Gujarat"];
//     if (!gujaratCities) {
//       console.log("❌ Gujarat data not found in indiaData JSON");
//       process.exit(1);
//     }

//     for (let cityName in gujaratCities) {
//       try {
//         // 3a. City create/find
//         let city = await City.findOne({ name: cityName, state: state._id });
//         if (!city) {
//           city = await City.create({ name: cityName, state: state._id });
//           console.log(`✅ City '${cityName}' created`);
//         } else {
//           console.log(`ℹ️ City '${cityName}' already exists`);
//         }

//         // 3b. Areas + Pincode create
//         const areasObj = gujaratCities[cityName];
//         for (let areaName in areasObj) {
//           const pincodeValue = areasObj[areaName].trim();
//           try {
//             const exists = await Pincode.findOne({ city: city._id, areaName });
//             if (!exists) {
//               await Pincode.create({
//                 areaName,
//                 pincode: pincodeValue,
//                 city: city._id,
//               });
//               console.log(
//                 `   ✅ Area '${areaName}' (Pincode: ${pincodeValue}) added`
//               );
//             } else {
//               console.log(`   ℹ️ Area '${areaName}' already exists`);
//             }
//           } catch (err) {
//             console.log(`   ❌ Error adding area '${areaName}':`, err.message);
//           }
//         }
//       } catch (err) {
//         console.log(`❌ Error creating city '${cityName}':`, err.message);
//       }
//     }

//     console.log("🎉 Gujarat data imported successfully!");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Error importing Gujarat data:", error.message);
//     process.exit(1);
//   }
// };

// // ------------------ 4. Run import ------------------
// // importIndiaData();

// export const importGujaratPincodes = async () => {
//   try {
//     let country = await Country.findOne({ name: "India" });
//     if (!country) country = await Country.create({ name: "India" });

//     let state = await State.findOne({ name: "Gujarat", country: country._id });
//     if (!state)
//       state = await State.create({ name: "Gujarat", country: country._id });

//     const gujaratCities = indiaData["Gujarat"];
//     if (!gujaratCities) {
//       console.log("❌ Gujarat data not found in indiaData JSON");
//       process.exit(1);
//     }

//     for (let cityName in gujaratCities) {
//       let city = await City.findOne({ name: cityName, state: state._id });
//       if (!city) city = await City.create({ name: cityName, state: state._id });

//       const areasObj = gujaratCities[cityName];
//       for (let areaName in areasObj) {
//         const pincodeValue = areasObj[areaName].trim();

//         // Ab direct insert hoga, koi duplicate check nahi
//         await Pincode.create({
//           areaName,
//           pincode: pincodeValue,
//           city: city._id,
//         });

//         console.log(
//           `   ✅ Area '${areaName}' (Pincode: ${pincodeValue}) added`
//         );
//       }
//     }

//     console.log("🎉 Gujarat pincodes imported successfully!");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ Error importing Gujarat pincodes:", error.message);
//     process.exit(1);
//   }
// };
