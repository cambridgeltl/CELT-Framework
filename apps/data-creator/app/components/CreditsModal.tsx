'use client';

import { Modal } from './ui/Modal';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wider mt-6 mb-3 first:mt-0">
    {children}
  </h3>
);

const PersonList = ({ people }: { people: string[] }) => (
  <ul className="space-y-1.5 ml-1">
    {people.map((person) => (
      <li key={person} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
        {person}
      </li>
    ))}
  </ul>
);

const TechList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 ml-1">
    {items.map((item) => (
      <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-info)] flex-shrink-0" />
        {item}
      </li>
    ))}
  </ul>
);

export default function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credits" size="lg">
      <div className="space-y-1">
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          This app is a collaborative effort between Dzardzongke speakers and researchers from the University of Cambridge and the EPHE-PSL in Paris. We would like to thank XX for their generous funding to develop the first prototype of the app. The app will be accompanied by an introductory textbook to learn the Dzardzongke language.
        </p>

        <SectionTitle>Dzardzongke speakers and collaborators</SectionTitle>
        <PersonList people={[
          'Palgen Bista',
          'Tshewang Gurung',
          'Lhabon Takla',
          'Tenzin Thakuri',
          'Kemi Tsewang',
          'Tsewang Khyenga',
          'Gyaltsen Muktivilla',
        ]} />

        <SectionTitle>Illustrations</SectionTitle>
        <PersonList people={[
          'Hilaria Cruz',
          'Kids at the Lubrak hostel: XX, YY, ZZ (TBC)',
        ]} />

        <SectionTitle>Research team</SectionTitle>
        <PersonList people={[
          'Hannah Claus (University of Cambridge)',
          'Songbo Hu (University of Cambridge)',
          'Emre Isik (University of Cambridge)',
          'Anna Korhonen (University of Cambridge)',
          'Kitty Liu (University of Cambridge)',
          'Marieke Meelen (University of Cambridge)',
          'Charles Ramble (EPHE-PSL, Paris)',
        ]} />

        <SectionTitle>Technical Development</SectionTitle>
        <TechList items={[
          'React Native & Expo Framework',
          'TypeScript Implementation',
          'SQLite Database Integration',
          'Audio & Media Management',
          'Cross-platform Compatibility',
        ]} />

        <SectionTitle>Future Development</SectionTitle>
        <TechList items={[
          'Advanced Learning Algorithms',
          'Community Features',
          'Offline Content Synchronization',
          'Multi-language Support Framework',
          'Analytics & Progress Tracking',
        ]} />
      </div>
    </Modal>
  );
}
