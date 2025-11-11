import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QuestionImport } from '@/components/questions/question-import';
import { QuestionList } from '@/components/questions/question-list';

export default function QuestionsPage(): React.ReactElement {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Questions</h1>
            <p className="text-muted-foreground">Import and manage your learning questions</p>
          </div>
          <Link href="/">
            <Button variant="outline">← Home</Button>
          </Link>
        </div>

        <div className="space-y-8">
          {/* Import Section */}
          <QuestionImport />

          {/* Questions List Section */}
          <QuestionList />
        </div>
      </div>
    </div>
  );
}
