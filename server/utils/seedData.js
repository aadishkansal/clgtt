import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Faculty from "../models/Faculty.js";
import Subject from "../models/Subject.js";
import Classroom from "../models/Classroom.js";
import TimeSlot from "../models/TimeSlot.js";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log("ðŸ—‘ï¸  Clearing existing data...");
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Classroom.deleteMany({});
    await TimeSlot.deleteMany({});
    console.log("âœ… Existing data cleared");

    // ====================
    // FACULTY DATA
    // ====================
    console.log("\nðŸ‘¥ Creating Faculty...");
    const facultyData = [
      // Year II Faculty
      {
        name: "Dr. Shivangi Bande",
        facultyID: "FAC001",
        email: "shivangi.bande@iet.edu",
        phone: "+91-9876543210",
        department: "Electronics & Instrumentation",
        subjects: [], // Will be populated after subjects created
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Hemlata Pal",
        facultyID: "FAC002",
        email: "hemlata.pal@iet.edu",
        phone: "+91-9876543211",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Shashi Prakash",
        facultyID: "FAC003",
        email: "shashi.prakash@iet.edu",
        phone: "+91-9876543212",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Ajay Verma",
        facultyID: "FAC004",
        email: "ajay.verma@iet.edu",
        phone: "+91-9876543213",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Mrs. Suman Sharma",
        facultyID: "FAC005",
        email: "suman.sharma@iet.edu",
        phone: "+91-9876543214",
        department: "Mathematics",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Mrs. Garvita Singhal",
        facultyID: "FAC006",
        email: "garvita.singhal@iet.edu",
        phone: "+91-9876543215",
        department: "Mathematics",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Mr. Amit Jha",
        facultyID: "FAC007",
        email: "amit.jha@iet.edu",
        phone: "+91-9876543216",
        department: "Computer Science",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },

      // Year III Faculty
      {
        name: "Dr. Ravi Sindal",
        facultyID: "FAC008",
        email: "ravi.sindal@iet.edu",
        phone: "+91-9876543217",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Sangita Solanki",
        facultyID: "FAC009",
        email: "sangita.solanki@iet.edu",
        phone: "+91-9876543218",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Madhvi Jangalwa",
        facultyID: "FAC010",
        email: "madhvi.jangalwa@iet.edu",
        phone: "+91-9876543219",
        department: "Computer Science",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Dhiraj Nitnaware",
        facultyID: "FAC011",
        email: "dhiraj.nitnaware@iet.edu",
        phone: "+91-9876543220",
        department: "Computer Science",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Ruchi Singh",
        facultyID: "FAC012",
        email: "ruchi.singh@iet.edu",
        phone: "+91-9876543221",
        department: "Management",
        subjects: [],
        maxHoursPerWeek: 20,
        isActive: true,
      },

      // Year IV Faculty
      {
        name: "Mr. Deepak Tawali",
        facultyID: "FAC013",
        email: "deepak.tawali@iet.edu",
        phone: "+91-9876543222",
        department: "Computer Science",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Ms. Nilima Ahire",
        facultyID: "FAC014",
        email: "nilima.ahire@iet.edu",
        phone: "+91-9876543223",
        department: "Computer Science",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Dr. Rajesh Gupta",
        facultyID: "FAC015",
        email: "rajesh.gupta@iet.edu",
        phone: "+91-9876543224",
        department: "Electronics & Instrumentation",
        subjects: [],
        maxHoursPerWeek: 20,
        isActive: true,
      },

      // Year I Faculty (to make it complete)
      {
        name: "Dr. Priya Sharma",
        facultyID: "FAC016",
        email: "priya.sharma@iet.edu",
        phone: "+91-9876543225",
        department: "Mathematics",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
      {
        name: "Mr. Vikram Singh",
        facultyID: "FAC017",
        email: "vikram.singh@iet.edu",
        phone: "+91-9876543226",
        department: "Physics",
        subjects: [],
        maxHoursPerWeek: 24,
        isActive: true,
      },
    ];

    const createdFaculty = await Faculty.insertMany(facultyData);
    console.log(`âœ… Created ${createdFaculty.length} faculty members`);

    // ====================
    // SUBJECTS DATA (ALL 4 YEARS)
    // ====================
    console.log("\nðŸ“š Creating Subjects...");

    const subjectData = [
      // ============ YEAR I - SEMESTER 1 ============
      {
        name: "Engineering Mechanics",
        subjectCode: "1REPM1",
        year: 1,
        semester: 1,
        department: "Mechanical",
        type: ["L"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Chemistry",
        subjectCode: "1REBS2",
        year: 1,
        semester: 1,
        department: "Chemistry",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Basic Programming",
        subjectCode: "1REBS3",
        year: 1,
        semester: 1,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Communication Skills",
        subjectCode: "1REBS4",
        year: 1,
        semester: 1,
        department: "Humanities",
        type: ["T"],
        creditHours: 2,
        assignedFaculty: [],
      },

      // ============ YEAR II - SEMESTER 1 ============
      {
        name: "Digital Electronics",
        subjectCode: "3REPC1",
        year: 2,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Data Structures",
        subjectCode: "3REPC2",
        year: 2,
        semester: 1,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Analog Electronics",
        subjectCode: "3REPC3",
        year: 2,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Signal and System Analysis",
        subjectCode: "3REPC4",
        year: 2,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L"],
        creditHours: 3,
        assignedFaculty: [],
      },
      {
        name: "Applied Maths - III",
        subjectCode: "3REBS1",
        year: 2,
        semester: 1,
        department: "Mathematics",
        type: ["L"],
        creditHours: 3,
        assignedFaculty: [],
      },
      {
        name: "Software Workshop - I",
        subjectCode: "3REPC5",
        year: 2,
        semester: 1,
        department: "Computer Science",
        type: ["P"],
        creditHours: 2,
        assignedFaculty: [],
      },
      {
        name: "Indian Knowledge System",
        subjectCode: "3REIK1",
        year: 2,
        semester: 1,
        department: "Humanities",
        type: ["T"],
        creditHours: 2,
        assignedFaculty: [],
      },

      // ============ YEAR III - SEMESTER 1 ============
      {
        name: "SOC Design using HDL",
        subjectCode: "5EIRC1",
        year: 3,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Python Programming",
        subjectCode: "5EIRC2",
        year: 3,
        semester: 1,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "Microcontrollers",
        subjectCode: "5EIRC3",
        year: 3,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "AI and Machine Learning",
        subjectCode: "5EIRE1",
        year: 3,
        semester: 1,
        department: "Computer Science",
        type: ["L"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "Computer Networks",
        subjectCode: "5EIRG3",
        year: 3,
        semester: 1,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Software Workshop - II",
        subjectCode: "5EIRL3",
        year: 3,
        semester: 1,
        department: "Computer Science",
        type: ["P"],
        creditHours: 1,
        assignedFaculty: [],
      },
      {
        name: "Principles of Management",
        subjectCode: "5SERS5",
        year: 3,
        semester: 1,
        department: "Management",
        type: ["T"],
        creditHours: 2,
        assignedFaculty: [],
      },

      // ============ YEAR IV - SEMESTER 1 ============
      {
        name: "Operating System",
        subjectCode: "7EIRC1",
        year: 4,
        semester: 1,
        department: "Computer Science",
        type: ["L"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Internet of Things (IoT)",
        subjectCode: "7EIRC2",
        year: 4,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L", "P"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "Process Instrumentation and Control",
        subjectCode: "7EIRC3",
        year: 4,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["L"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "Software Engineering",
        subjectCode: "7EIRE1",
        year: 4,
        semester: 1,
        department: "Computer Science",
        type: ["L"],
        creditHours: 5,
        assignedFaculty: [],
      },
      {
        name: "Project Phase - I",
        subjectCode: "7EIRP1",
        year: 4,
        semester: 1,
        department: "Electronics & Instrumentation",
        type: ["P"],
        creditHours: 7,
        assignedFaculty: [],
      },

      // ============ YEAR II - SEMESTER 2 ============
      {
        name: "Microprocessor & Microcontrollers",
        subjectCode: "3REPC6",
        year: 2,
        semester: 2,
        department: "Electronics & Instrumentation",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Database Management Systems",
        subjectCode: "3REPC7",
        year: 2,
        semester: 2,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Power Electronics",
        subjectCode: "3REPC8",
        year: 2,
        semester: 2,
        department: "Electronics & Instrumentation",
        type: ["L"],
        creditHours: 4,
        assignedFaculty: [],
      },

      // ============ YEAR III - SEMESTER 2 ============
      {
        name: "Embedded Systems",
        subjectCode: "5EIRC4",
        year: 3,
        semester: 2,
        department: "Electronics & Instrumentation",
        type: ["L", "P"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Web Technologies",
        subjectCode: "5EIRC5",
        year: 3,
        semester: 2,
        department: "Computer Science",
        type: ["L", "P"],
        creditHours: 5,
        assignedFaculty: [],
      },

      // ============ YEAR IV - SEMESTER 2 ============
      {
        name: "Cloud Computing",
        subjectCode: "7EIRC4",
        year: 4,
        semester: 2,
        department: "Computer Science",
        type: ["L"],
        creditHours: 4,
        assignedFaculty: [],
      },
      {
        name: "Project Phase - II",
        subjectCode: "7EIRP2",
        year: 4,
        semester: 2,
        department: "Electronics & Instrumentation",
        type: ["P"],
        creditHours: 10,
        assignedFaculty: [],
      },
    ];

    const createdSubjects = await Subject.insertMany(subjectData);
    console.log(`âœ… Created ${createdSubjects.length} subjects`);

    // ====================
    // ASSIGN SUBJECTS TO FACULTY (CREATES CONFLICT SCENARIOS)
    // ====================
    console.log("\nðŸ”— Assigning subjects to faculty...");

    // Create subject mapping for easy lookup
    const subjectMap = {};
    createdSubjects.forEach((subject) => {
      subjectMap[subject.subjectCode] = subject._id;
    });

    // Faculty assignments with multiple subjects (for conflict testing)
    const facultyAssignments = {
      FAC001: ["3REPC1", "3REPC3", "5EIRC1"], // Dr. Shivangi - teaches 3 subjects
      FAC002: ["3REPC4", "5EIRC3"],
      FAC003: ["3REPC3"],
      FAC004: ["3REPC4"],
      FAC005: ["3REBS1"],
      FAC006: ["3REBS1"],
      FAC007: ["3REPC2"],
      FAC008: ["5EIRC1"],
      FAC009: ["5EIRC3"],
      FAC010: ["5EIRC2", "5EIRE1", "7EIRC1"], // Dr. Madhvi - teaches 3 subjects
      FAC011: ["5EIRE1", "7EIRE1"],
      FAC012: ["5SERS5"],
      FAC013: ["7EIRC1"],
      FAC014: ["7EIRE1"],
      FAC015: ["7EIRC2"],
      FAC016: ["1REBS2"],
      FAC017: ["1REBS3"],
    };

    for (const [facultyID, subjectCodes] of Object.entries(
      facultyAssignments
    )) {
      const faculty = createdFaculty.find((f) => f.facultyID === facultyID);
      if (faculty) {
        faculty.subjects = subjectCodes.map((code) => subjectMap[code]);
        await faculty.save();
      }
    }

    console.log(`âœ… Assigned subjects to faculty`);

    // ====================
    // CLASSROOMS DATA
    // ====================
    console.log("\nðŸ« Creating Classrooms...");

    const classroomData = [
      // D Block Classrooms
      {
        roomNumber: "D-101",
        block: "D",
        capacity: 60,
        type: "lab",
        facilities: ["Computers", "Projector", "AC", "Whiteboard"],
        isActive: true,
      },
      {
        roomNumber: "D-102",
        block: "D",
        capacity: 70,
        type: "theory",
        facilities: ["Projector", "AC", "Whiteboard", "Smart Board"],
        isActive: true,
      },
      {
        roomNumber: "D-104",
        block: "D",
        capacity: 60,
        type: "lab",
        facilities: ["Computers", "Projector", "AC"],
        isActive: true,
      },
      {
        roomNumber: "D-107",
        block: "D",
        capacity: 60,
        type: "lab",
        facilities: ["Lab Equipment", "Projector", "AC"],
        isActive: true,
      },
      {
        roomNumber: "D-108",
        block: "D",
        capacity: 60,
        type: "lab",
        facilities: ["Lab Equipment", "Computers", "Projector"],
        isActive: true,
      },
      {
        roomNumber: "D-201",
        block: "D",
        capacity: 80,
        type: "theory",
        facilities: ["Projector", "AC", "Whiteboard", "Audio System"],
        isActive: true,
      },
      {
        roomNumber: "D-202",
        block: "D",
        capacity: 80,
        type: "theory",
        facilities: ["Projector", "AC", "Whiteboard", "Smart Board"],
        isActive: true,
      },
      {
        roomNumber: "D-208",
        block: "D",
        capacity: 80,
        type: "theory",
        facilities: ["Projector", "AC", "Whiteboard"],
        isActive: true,
      },

      // E Block Classrooms
      {
        roomNumber: "E-105",
        block: "E",
        capacity: 60,
        type: "lab",
        facilities: ["Computers", "Projector", "AC", "Internet"],
        isActive: true,
      },
      {
        roomNumber: "E-301",
        block: "E",
        capacity: 60,
        type: "lab",
        facilities: ["Computers", "Projector", "AC"],
        isActive: true,
      },
      {
        roomNumber: "E-309",
        block: "E",
        capacity: 100,
        type: "seminar",
        facilities: ["Projector", "AC", "Audio System", "Stage", "Podium"],
        isActive: true,
      },

      // A Block Classrooms
      {
        roomNumber: "A-205",
        block: "A",
        capacity: 80,
        type: "theory",
        facilities: ["Projector", "AC", "Whiteboard"],
        isActive: true,
      },
      {
        roomNumber: "A-301",
        block: "A",
        capacity: 70,
        type: "theory",
        facilities: ["Projector", "AC", "Smart Board"],
        isActive: true,
      },
    ];

    const createdClassrooms = await Classroom.insertMany(classroomData);
    console.log(`âœ… Created ${createdClassrooms.length} classrooms`);

    // ====================
    // TIME SLOTS DATA
    // ====================
    console.log("\nâ° Creating Time Slots...");

    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const timeSlots = [
      { start: "08:00", end: "09:00", period: 1, isBreak: false },
      { start: "09:00", end: "10:00", period: 2, isBreak: false },
      { start: "10:00", end: "11:00", period: 3, isBreak: false },
      { start: "11:00", end: "12:00", period: 4, isBreak: false },
      { start: "12:00", end: "13:00", period: 5, isBreak: false }, // Not a break by default
      { start: "13:00", end: "14:00", period: 6, isBreak: false },
      { start: "14:00", end: "15:00", period: 7, isBreak: false },
      { start: "15:00", end: "16:00", period: 8, isBreak: false },
      { start: "16:00", end: "17:00", period: 9, isBreak: false },
    ];

    const timeSlotData = [];
    let slotCounter = 1;

    days.forEach((day) => {
      timeSlots.forEach((slot) => {
        timeSlotData.push({
          slotID: `SLOT-${slotCounter.toString().padStart(3, "0")}`,
          day: day,
          startTime: slot.start,
          endTime: slot.end,
          duration: 60,
          periodNumber: slot.period,
          isBreak: slot.isBreak,
        });
        slotCounter++;
      });
    });

    const createdTimeSlots = await TimeSlot.insertMany(timeSlotData);
    console.log(`âœ… Created ${createdTimeSlots.length} time slots`);

    // ====================
    // SUMMARY
    // ====================
    console.log("\n" + "=".repeat(60));
    console.log("ðŸŽ‰ SEED DATA COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log(`\nðŸ“Š Summary:`);
    console.log(`   ðŸ‘¥ Faculty Members: ${createdFaculty.length}`);
    console.log(`   ðŸ“š Subjects: ${createdSubjects.length}`);
    console.log(`   ðŸ« Classrooms: ${createdClassrooms.length}`);
    console.log(`   â° Time Slots: ${createdTimeSlots.length}`);

    console.log(
      "\nðŸ‘¨â€ðŸ« Faculty with Multiple Subjects (for conflict testing):"
    );
    console.log("   â€¢ Dr. Shivangi Bande (FAC001): 3REPC1, 3REPC3, 5EIRC1");
    console.log("   â€¢ Dr. Madhvi Jangalwa (FAC010): 5EIRC2, 5EIRE1, 7EIRC1");
    console.log("   â€¢ Dr. Dhiraj Nitnaware (FAC011): 5EIRE1, 7EIRE1");

    console.log("\nðŸ§ª Test Scenarios:");
    console.log(
      "   1. Try creating Year 2 & Year 3 with Dr. Shivangi at same time"
    );
    console.log(
      "   2. Try creating Year 3 & Year 4 with Dr. Madhvi at same time"
    );
    console.log("   3. Use same classroom for Year 2 & Year 3 at same time");
    console.log("   4. Mark 12:00-13:00 as break and test availability");

    console.log("\nâœ… Database is fully populated!");
    console.log("\nðŸ”‘ Login Credentials:");
    console.log("   Email: admin@college.edu");
    console.log("   Password: admin123\n");
    console.log("ðŸš€ You can now start creating timetables!\n");

    process.exit(0);
  } catch (error) {
    console.error("âŒ Error seeding data: ", error);
    process.exit(1);
  }
};

seedData();
