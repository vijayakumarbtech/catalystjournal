import { useEffect } from 'react';
import { User, Mail, Globe } from 'lucide-react';
import { useEditorialBoard } from '@/lib/queries';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import type { EditorialMember } from '@/types';

const roleLabels: Record<NonNullable<EditorialMember['role']>, string> = {
  'managing-director': 'Managing Director',
  'editor-in-chief': 'Editor-in-Chief',
  'associate-editor': 'Associate Editors',
  'editorial-board': 'Editorial Board Members',
  reviewer: 'Reviewers',
};

const roleOrder: NonNullable<EditorialMember['role']>[] = [
  'managing-director',
  'editor-in-chief',
  'associate-editor',
  'editorial-board',
  'reviewer',
];

function MemberCard({ member }: { member: EditorialMember }) {
  return (
    <div className="card-surface p-6 text-center flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-navy-900 mb-4 overflow-hidden border-2 border-stone-200">
        <ImageWithFallback
          src={member.photoUrl}
          alt={member.name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center text-gold-400">
              <User size={32} />
            </div>
          }
        />
      </div>
      {member.name && <h3 className="font-display font-bold text-navy-900">{member.name}</h3>}
      {member.designation && <p className="text-sm text-ink-700 mt-1">{member.designation}</p>}
      {member.qualification && <p className="text-xs text-ink-500 mt-1">{member.qualification}</p>}
      {(member.affiliation || member.university || member.country) && (
        <p className="text-xs text-ink-500">
          {[member.affiliation || member.university, member.country].filter(Boolean).join(', ')}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        {member.email && (
          <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`} className="text-ink-500 hover:text-navy-900">
            <Mail size={16} />
          </a>
        )}
        {(member.profileUrl || member.linkedin) && (
          <a href={member.profileUrl || member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on the Web`} className="text-ink-500 hover:text-navy-900">
            <Globe size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function EditorialBoard() {
  const { data: members, isLoading } = useEditorialBoard();

  useEffect(() => {
    document.title = 'Editorial Board — The Catalyst';
  }, []);

  const grouped = roleOrder
    .map((role) => ({
      role,
      members: members?.filter((m) => m.role === role).sort((a, b) => a.order - b.order) || [],
    }))
    .filter((g) => g.members.length > 0);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Editorial Board' }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Editorial Board</h1>
        <p className="text-ink-700 max-w-2xl mb-12">
          Our editorial board comprises accomplished academics and researchers who
          oversee the peer-review process and uphold the journal's scholarly standards.
        </p>

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-lg p-6 animate-pulse h-64" />
            ))}
          </div>
        )}

        {grouped.map((group) => (
          group.role && group.role in roleLabels && (
            <div key={group.role} className="mb-14 last:mb-0">
              <h2 className="font-label text-sm uppercase tracking-wide text-gold-600 mb-6">
                {roleLabels[group.role]}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {group.members.map((m) => (
                  <MemberCard key={m._id} member={m} />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </>
  );
}
