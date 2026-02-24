import { prisma } from './db';

export async function instructorOwnsAssignment(
  assignmentId: string,
  instructorCode: string
): Promise<boolean> {
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      instructorCode,
    },
    select: { id: true },
  });

  return Boolean(assignment);
}

export async function instructorOwnsText(
  textId: string,
  instructorCode: string
): Promise<boolean> {
  const text = await prisma.generatedText.findFirst({
    where: {
      id: textId,
      assignment: {
        instructorCode,
      },
    },
    select: { id: true },
  });

  return Boolean(text);
}

export async function textBelongsToAssignment(
  textId: string,
  assignmentId: string
): Promise<boolean> {
  const text = await prisma.generatedText.findFirst({
    where: {
      id: textId,
      assignmentId,
    },
    select: { id: true },
  });

  return Boolean(text);
}
