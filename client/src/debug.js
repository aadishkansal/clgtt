console.log("=== DEBUG START ===");

// Check if all files exist and export correctly
const checkExports = async () => {
  console.log("📁 Checking component exports...\n");

  try {
    // Test Button
    const Button = await import("./components/Common/Button.jsx");
    console.log("✅ Button.jsx exports:", Object.keys(Button));

    // Test Input
    const Input = await import("./components/Common/Input.jsx");
    console.log("✅ Input.jsx exports:", Object.keys(Input));

    // Test Select
    const Select = await import("./components/Common/Select.jsx");
    console.log("✅ Select.jsx exports:", Object.keys(Select));

    // Test Modal
    const Modal = await import("./components/Common/Modal.jsx");
    console.log("✅ Modal.jsx exports:", Object.keys(Modal));

    // Test Loader
    const Loader = await import("./components/Common/Loader.jsx");
    console.log("✅ Loader.jsx exports:", Object.keys(Loader));

    console.log("\n🎉 All components export correctly!");
  } catch (error) {
    console.error("❌ Export Check Error:", error.message);
    console.error("Full Error:", error);
  }
};

// Run checks
checkExports();

// Check localStorage
console.log("\n📦 LocalStorage:", {
  token: localStorage.getItem("token"),
  admin: localStorage.getItem("admin"),
});

// Check API URL
console.log("\n🔌 API Config:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

console.log("=== DEBUG END ===\n");
