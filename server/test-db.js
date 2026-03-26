const mongoose = require('mongoose');
const uri = "mongodb+srv://aasthadahuja11_db_user:aasthadahuja11@cluster0.o6rgked.mongodb.net/contact_manager?retryWrites=true&w=majority";

console.log("Testing connection...");
mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connection SUCCESSFUL!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection FAILED:", err.message);
    process.exit(1);
  });
