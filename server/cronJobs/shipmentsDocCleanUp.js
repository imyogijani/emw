import cron from "node-cron";

// 🟢 Har din raat 12 baje run hoga aur purane 7 din ke files delete karega
cron.schedule("0 0 * * *", () => {
  const dir = path.join(process.cwd(), "labels");
  const now = Date.now();

  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      // Agar file 7 din se purani hai to delete
      const ageInMs = now - stats.mtimeMs;
      if (ageInMs > 7 * 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        console.log(`🗑 Deleted old label: ${file}`);
      }
    });
  }
});
