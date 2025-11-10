import PDFDocument from "pdfkit";

export const generateTimetablePDF = async (timetableData) => {

  console.log("PDF GENERATOR DATA:", JSON.stringify(timetableData, null, 2));
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 20,
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("COLLEGE TIMETABLE", { align: "center" });
      doc.moveDown(0.2);

      doc
        .fontSize(12)
        .font("Helvetica")
        .text(
          `Year: ${timetableData.year} | Section: ${timetableData.section} | Academic Year: ${timetableData.academicYear}`,
          { align: "center" }
        );
      doc
        .fontSize(11)
        .text(`Semester: ${timetableData.semester}`, { align: "center" });
      doc.moveDown(0.5);

      // Organize data by day and time
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const timeSlotMap = {}; // Organized by day and time
      const breakMap = {}; // âœ… NEW - Track breaks

      // âœ… NEW - Build break map organized by day and time
      if (timetableData.breaks && Array.isArray(timetableData.breaks)) {
        timetableData.breaks.forEach((breakEntry) => {
          if (breakEntry.timeslot) {
            const day = breakEntry.timeslot.day;
            const time = breakEntry.timeslot.startTime;
            const key = `${day}-${time}`;
            breakMap[key] = true; // Mark as break
            console.log(`ðŸ”— Break mapped: ${key}`);
          }
        });
      }

      // âœ… Group all entries by day and time
      if (timetableData.schedule && Array.isArray(timetableData.schedule)) {
        timetableData.schedule.forEach((entry) => {
          if (entry.timeslot) {
            const day = entry.timeslot.day;
            const time = entry.timeslot.startTime;
            const key = `${day}-${time}`;

            if (!timeSlotMap[key]) {
              timeSlotMap[key] = {
                day,
                time,
                startTime: entry.timeslot.startTime,
                endTime: entry.timeslot.endTime,
                entries: [],
              };
            }

            timeSlotMap[key].entries.push({
              subject: entry.subject?.subjectCode || "N/A",
              faculty: entry.faculty?.name || "N/A",
              classroom: entry.classroom?.roomNumber || "N/A",
              batch: entry.batchGroup || "Full",
              isRMC: entry.isRMC || false,
            });
          }
        });
      }

      // Build timetable grid
      const tableTop = 100;
      const tableLeft = 20;
      const colWidth = 110;
      const rowHeight = 50;

      // Extract unique time slots
      const uniqueTimeslots = [];
      Object.values(timeSlotMap).forEach((slot) => {
        if (!uniqueTimeslots.find((t) => t.time === slot.time)) {
          uniqueTimeslots.push(slot);
        }
      });

      // âœ… NEW - Also include break times in unique slots
      Object.keys(breakMap).forEach((key) => {
        const [day, time] = key.split("-");
        if (!uniqueTimeslots.find((t) => t.time === time)) {
          uniqueTimeslots.push({
            day,
            time,
            startTime: time,
            endTime: "", // Will calculate from next slot
          });
        }
      });

      uniqueTimeslots.sort((a, b) => a.time.localeCompare(b.time));

      // Draw header row
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Time/Period", tableLeft, tableTop, {
        width: colWidth - 5,
        align: "center",
      });

      days.forEach((day, i) => {
        doc.text(day, tableLeft + (i + 1) * colWidth, tableTop, {
          width: colWidth,
          align: "center",
        });
      });

      // Draw header line
      doc
        .moveTo(tableLeft, tableTop + 18)
        .lineTo(tableLeft + (days.length + 1) * colWidth, tableTop + 18)
        .stroke();

      // Draw time slots
      uniqueTimeslots.forEach((slot, rowIndex) => {
        const yPos = tableTop + 25 + rowIndex * rowHeight;

        // Time cell
        doc.fontSize(8).font("Helvetica-Bold");

        // âœ… NEW - Handle end time properly
        const endTime =
          slot.endTime ||
          uniqueTimeslots[rowIndex + 1]?.startTime ||
          slot.startTime;
        doc.text(`${slot.startTime}-${endTime}`, tableLeft + 2, yPos + 15, {
          width: colWidth - 4,
          align: "center",
        });

        // Day cells
        days.forEach((day, colIndex) => {
          const xPos = tableLeft + (colIndex + 1) * colWidth;
          const key = `${day}-${slot.startTime}`;
          const slotData = timeSlotMap[key];
          const isBreak = breakMap[key]; // âœ… NEW - Check if break

          // âœ… NEW - Display BREAK if marked as break
          if (isBreak && !slotData) {
            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .fillColor("red")
              .text("BREAK", xPos + 2, yPos + 18, {
                width: colWidth - 4,
                align: "center",
              });
            doc.fillColor("black");
          } else if (slotData && slotData.entries.length > 0) {
            // âœ… NEW: Show ALL entries for this slot
            let yOffset = yPos + 2;
            doc.fontSize(7).font("Helvetica-Bold");

            slotData.entries.forEach((entry, idx) => {
              if (idx > 0) {
                doc
                  .fontSize(6)
                  .font("Helvetica")
                  .text("|", xPos + colWidth / 2 - 5, yOffset);
                yOffset += 8;
              }

              doc
                .fontSize(7)
                .font("Helvetica-Bold")
                .text(entry.subject, xPos + 2, yOffset, {
                  width: colWidth - 4,
                  align: "center",
                });
              yOffset += 8;

              doc
                .fontSize(6)
                .font("Helvetica")
                .text(entry.faculty, xPos + 2, yOffset, {
                  width: colWidth - 4,
                  align: "center",
                });
              yOffset += 7;

              doc.text(
                `${entry.classroom} (${entry.batch})`,
                xPos + 2,
                yOffset,
                {
                  width: colWidth - 4,
                  align: "center",
                }
              );
              yOffset += 7;

              if (entry.isRMC) {
                doc
                  .fillColor("red")
                  .text("RMC", xPos + colWidth - 12, yPos + 2);
                doc.fillColor("black");
              }
            });
          }

          // Draw cell border
          doc.rect(xPos, yPos, colWidth, rowHeight).stroke();
        });

        // Draw time cell border
        doc.rect(tableLeft, yPos, colWidth, rowHeight).stroke();
      });

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .text(
          `Generated on: ${new Date().toLocaleDateString("en-IN")} | Total Entries: ${timetableData.schedule?.length || 0} | Breaks: ${timetableData.breaks?.length || 0}`,
          tableLeft,
          doc.page.height - 30,
          { align: "center" }
        );

      doc.end();
    } catch (error) {
      console.error("âŒ PDF Generation Error:", error);
      reject(error);
    }
  });
};
