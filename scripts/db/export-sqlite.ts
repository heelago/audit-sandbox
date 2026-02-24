import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

function timestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function main() {
  const [
    assignments,
    generatedTexts,
    rubricItems,
    calibrationLogs,
    annotations,
    evidence,
    scores,
    rubricMatches,
    beyondRubricFindings,
  ] = await Promise.all([
    prisma.assignment.findMany(),
    prisma.generatedText.findMany(),
    prisma.rubricItem.findMany(),
    prisma.calibrationLog.findMany(),
    prisma.annotation.findMany(),
    prisma.evidence.findMany(),
    prisma.score.findMany(),
    prisma.rubricMatch.findMany(),
    prisma.beyondRubricFinding.findMany(),
  ]);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    source: "sqlite",
    counts: {
      assignments: assignments.length,
      generatedTexts: generatedTexts.length,
      rubricItems: rubricItems.length,
      calibrationLogs: calibrationLogs.length,
      annotations: annotations.length,
      evidence: evidence.length,
      scores: scores.length,
      rubricMatches: rubricMatches.length,
      beyondRubricFindings: beyondRubricFindings.length,
    },
    data: {
      assignments,
      generatedTexts,
      rubricItems,
      calibrationLogs,
      annotations,
      evidence,
      scores,
      rubricMatches,
      beyondRubricFindings,
    },
  };

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const outfile = path.join(backupDir, `sqlite-export-${timestamp()}.json`);
  await writeFile(outfile, JSON.stringify(exportPayload, null, 2), "utf8");
  console.log(`SQLite export saved: ${outfile}`);
}

main()
  .catch((error) => {
    console.error("Failed to export SQLite data:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

