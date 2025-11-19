import PDFDocument from "pdfkit";

export const generateTimetablePDF = async (timetableData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 15,
        bufferPages: true,
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // --- PAGE METRICS ---
      const margin = 15;
      const width = doc.page.width - 2 * margin;
      const height = doc.page.height - 2 * margin;

      let currentY = margin;

      // --- 1. TITLE & HEADER ---
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("Devi Ahilya Vishwavidyalaya, Indore", margin, currentY, {
          align: "center",
          width: width,
        });
      currentY += 18;
      doc
        .fontSize(11)
        .text("Institute of Engineering & Technology", margin, currentY, {
          align: "center",
          width: width,
        });
      currentY += 16;

      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Year: ${timetableData.year} | Semester: ${timetableData.semester} | Section: ${timetableData.section} | Department: ${timetableData.department || "N/A"} | Session: ${timetableData.academicYear || "2024-25"}`,
          margin,
          currentY,
          { align: "center", width: width }
        );
      currentY += 15;

      // --- 2. DATA PREPARATION ---
      const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const timeSlotMap = new Map();
      const gridData = {};

      const parseTime = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
      };

      // Process Schedule Entries
      if (timetableData.schedule) {
        timetableData.schedule.forEach((entry) => {
          if (entry.timeslot) {
            const { day, startTime, endTime } = entry.timeslot;
            if (!timeSlotMap.has(startTime)) {
              timeSlotMap.set(startTime, { start: startTime, end: endTime });
            }
            const key = `${day}-${startTime}`;
            if (!gridData[key]) gridData[key] = [];
            gridData[key].push(entry);
          }
        });
      }

      // Process Breaks
      if (timetableData.breaks) {
        timetableData.breaks.forEach((b) => {
          if (b.timeslot) {
            const { day, startTime, endTime } = b.timeslot;
            if (!timeSlotMap.has(startTime)) {
              timeSlotMap.set(startTime, { start: startTime, end: endTime });
            }
            const key = `${day}-${startTime}`;
            if (!gridData[key]) {
              gridData[key] = [{ isBreak: true, label: b.label || "BREAK" }];
            }
          }
        });
      }

      const sortedTimes = Array.from(timeSlotMap.values()).sort(
        (a, b) => parseTime(a.start) - parseTime(b.start)
      );

      // --- 3. GRID LAYOUT ---
      const footerHeight = 150;
      const availableHeightForGrid = height - currentY - footerHeight;
      const minRowHeight = 35;
      let rowHeight = availableHeightForGrid / (sortedTimes.length + 1);
      if (rowHeight < minRowHeight) rowHeight = minRowHeight;

      const colWidth = width / 7;

      // --- 4. DRAW GRID HEADER ---
      doc.lineWidth(0.5);
      let x = margin;

      doc.rect(x, currentY, colWidth, 20).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Time / Day", x, currentY + 6, {
          width: colWidth,
          align: "center",
        });

      days.forEach((day) => {
        x += colWidth;
        doc.rect(x, currentY, colWidth, 20).stroke();
        doc.text(day, x, currentY + 6, { width: colWidth, align: "center" });
      });
      currentY += 20;

      // --- 5. DRAW GRID ROWS ---
      sortedTimes.forEach((slot) => {
        let rowY = currentY;

        doc.rect(margin, rowY, colWidth, rowHeight).stroke();
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            `${slot.start} - ${slot.end}`,
            margin,
            rowY + rowHeight / 2 - 4,
            { width: colWidth, align: "center" }
          );

        days.forEach((day, i) => {
          const cellX = margin + (i + 1) * colWidth;
          const key = `${day}-${slot.start}`;
          const data = gridData[key] || [];

          doc.rect(cellX, rowY, colWidth, rowHeight).stroke();

          if (data.length > 0) {
            if (data[0].isBreak) {
              doc
                .font("Helvetica-Bold")
                .fontSize(10)
                .fillColor("#555")
                .text("BREAK", cellX, rowY + rowHeight / 2 - 4, {
                  width: colWidth,
                  align: "center",
                });
              doc.fillColor("black");
            } else {
              const count = data.length;
              const subCellWidth = colWidth / count;

              data.forEach((entry, idx) => {
                const subX = cellX + idx * subCellWidth;

                if (idx > 0) {
                  doc
                    .moveTo(subX, rowY)
                    .lineTo(subX, rowY + rowHeight)
                    .stroke();
                }

                const subjectCode = entry.subject?.subjectCode || "";
                const facultyName = entry.faculty?.name || "";
                const facultyInitials =
                  facultyName !== "N/A"
                    ? facultyName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "";

                const room = entry.classroom?.roomNumber || "";
                const batch =
                  entry.batchGroup === "Full"
                    ? "(All)"
                    : `(${entry.batchGroup})`;

                const padding = 4;
                let textY = rowY + padding;

                doc
                  .font("Helvetica-Bold")
                  .fontSize(10)
                  .text(subjectCode, subX, textY, {
                    width: subCellWidth,
                    align: "center",
                  });
                textY += 9;

                doc
                  .font("Helvetica")
                  .fontSize(8)
                  .text(`${facultyInitials} [${room}]`, subX, textY, {
                    width: subCellWidth,
                    align: "center",
                  });
                textY += 8;

                doc.fontSize(8).text(batch, subX, textY, {
                  width: subCellWidth,
                  align: "center",
                });

                if (entry.isRMC) {
                  textY += 8;
                  doc
                    .fillColor("red")
                    .text("RMC", subX, textY, {
                      width: subCellWidth,
                      align: "center",
                    })
                    .fillColor("black");
                }
              });
            }
          }
        });
        currentY += rowHeight;
      });

      // --- 6. DRAW LEGEND (FIXED) ---
      currentY += 10;

      if (currentY + 100 > height + margin) {
        doc.addPage();
        currentY = margin;
      }

      const lCol1 = width * 0.15;
      const lCol2 = width * 0.4;
      const lCol3 = width * 0.15;
      const lCol4 = width * 0.3;

      doc.rect(margin, currentY, lCol1, 15).stroke();
      doc.rect(margin + lCol1, currentY, lCol2, 15).stroke();
      doc.rect(margin + lCol1 + lCol2, currentY, lCol3, 15).stroke();
      doc.rect(margin + lCol1 + lCol2 + lCol3, currentY, lCol4, 15).stroke();

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Sub Code", margin + 2, currentY + 4, {
        width: lCol1,
        align: "left",
      });
      doc.text("Subject Name", margin + lCol1 + 2, currentY + 4, {
        width: lCol2,
        align: "left",
      });
      doc.text("Marks (L-T-P)", margin + lCol1 + lCol2 + 2, currentY + 4, {
        width: lCol3,
        align: "center",
      });
      doc.text(
        "Faculty Name (Key)",
        margin + lCol1 + lCol2 + lCol3 + 2,
        currentY + 4,
        { width: lCol4, align: "left" }
      );

      currentY += 15;

      const uniqueSubjects = new Map();
      if (timetableData.schedule) {
        timetableData.schedule.forEach((e) => {
          if (e.subject && e.subject.subjectCode) {
            const code = e.subject.subjectCode;
            const facName = e.faculty?.name || "N/A";
            const key = `${code}-${facName}`;

            if (!uniqueSubjects.has(key)) {
              // Ensure these exist and force Number type (this handles the "0 credits" issue)
              const l = Number(e.subject.lectureCredits || 0);
              const t = Number(e.subject.tutorialCredits || 0);
              const p = Number(e.subject.practicalCredits || 0);

              const initials =
                facName !== "N/A"
                  ? facName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "";

              uniqueSubjects.set(key, {
                code: code,
                name: e.subject.name,
                ltp: `${l}-${t}-${p}`, // This will now use the extracted numbers
                faculty: `${facName} (${initials})`,
              });
            }
          }
        });
      }

      doc.font("Helvetica").fontSize(10);
      uniqueSubjects.forEach((sub) => {
        const rowH = 12;
        if (currentY + rowH > height + margin) {
          doc.addPage();
          currentY = margin;
        }

        doc.rect(margin, currentY, lCol1, rowH).stroke();
        doc.rect(margin + lCol1, currentY, lCol2, rowH).stroke();
        doc.rect(margin + lCol1 + lCol2, currentY, lCol3, rowH).stroke();
        doc
          .rect(margin + lCol1 + lCol2 + lCol3, currentY, lCol4, rowH)
          .stroke();

        doc.text(sub.code, margin + 2, currentY + 3);
        doc.text(sub.name.substring(0, 55), margin + lCol1 + 2, currentY + 3);
        doc.text(sub.ltp, margin + lCol1 + lCol2, currentY + 3, {
          align: "center",
          width: lCol3,
        });
        doc.text(sub.faculty, margin + lCol1 + lCol2 + lCol3 + 2, currentY + 3);

        currentY += rowH;
      });

      // --- 7. FOOTER ---
      currentY += 5;
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .text(
          "Note: Classes will be conducted only in allotted rooms & time, Mutual exchange of lectures is not permitted until the permission of Co-ordinator/HOD/Director",
          margin,
          currentY
        );

      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}`,
        margin,
        currentY,
        { align: "right", width: width }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
