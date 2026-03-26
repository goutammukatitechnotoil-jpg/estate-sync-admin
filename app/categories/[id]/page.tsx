'use client';

import React, { use } from 'react';
import CategoryForm from '../category-form';

export default function EditCategoryPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  return <CategoryForm isEdit={true} categoryId={id} />;
}
