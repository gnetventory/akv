import React, { useState } from 'react';
import Modal from '../common/Modal';
import ManualForm from './ManualForm';
import { updateMember } from '../../utils/storage';
import { pushMemberUpdateToSheets } from '../../utils/sheetsSync';
import { useApp } from '../../contexts/AppContext';

export default function EditMemberModal({ member, isOpen, onClose, onSaved }) {
  const { notify, refreshMembers } = useApp();

  const handleSave = (formValues) => {
    const updated = updateMember(member.id, formValues);
    pushMemberUpdateToSheets(member, formValues);
    refreshMembers();
    notify(`Updated ${formValues.name}'s profile`);
    onSaved?.(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${member.name}`} size="lg">
      <ManualForm initialData={member} onSaved={handleSave} onCancel={onClose} isEdit={true} />
    </Modal>
  );
}
