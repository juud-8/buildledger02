type NotesSectionProps = {
  notes: string | null
  terms: string | null
}

export default function NotesSection({ notes, terms }: NotesSectionProps) {
  if (!notes && !terms) return null
  return (
    <div className="bg-white shadow rounded-lg p-6">
      {notes && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
      {terms && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Terms</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{terms}</p>
        </div>
      )}
    </div>
  )
} 