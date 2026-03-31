'use client';

import React, { use } from 'react';
import TeamMemberForm from '../../team-member-form';

export default function EditTeamMemberPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  return <TeamMemberForm isEdit={true} teamMemberId={id} />;
}