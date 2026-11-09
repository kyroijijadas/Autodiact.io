import { BookOpen, FileCheck2, GraduationCap, ShieldCheck } from 'lucide-react';

export const navigation = {
  student: [
    { label: 'Explore quizzes', icon: BookOpen },
    { label: 'My scores', icon: FileCheck2 },
    { label: 'Apply to teach', icon: GraduationCap },
  ],
  professor: [
    { label: 'My quizzes', icon: BookOpen },
    { label: 'Access requests', icon: ShieldCheck },
  ],
  admin: [
    { label: 'Professor applications', icon: FileCheck2 },
  ],
}

export const roleTitles = {
  student: 'Student',
  professor: 'Professor',
  admin: 'Administrator',
}

export const roleGreetings = {
  student: 'Ready to learn something new?',
  professor: 'Make your next lesson count.',
  admin: 'Your learning community at a glance.',
}
