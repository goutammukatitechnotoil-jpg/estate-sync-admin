import PropertyForm from '../../property-form';

interface EditPropertyPageProps {
  params: {
    id: string;
  };
}

export default function EditPropertyPage({ params }: EditPropertyPageProps) {
  return <PropertyForm />;
}
