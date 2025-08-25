import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ExpandableText from '../ExpandableText';
import { useTranslations } from '@/hooks/useTranslations';

interface EditableNotesCellProps {
  value: string | null;
  onSave: (newValue: string) => Promise<void>;
  patientName?: string | null;
  patientChineseName?: string | null;
  maxDisplayLength?: number;
  canEdit?: boolean;
}

export function EditableNotesCell({ 
  value, 
  onSave, 
  patientName, 
  patientChineseName, 
  maxDisplayLength = 10,
  canEdit = true
}: EditableNotesCellProps) {
  const { patients: patientTranslations } = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenModal = () => {
    console.log('Opening modal with value:', value);
    setEditValue(value || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    console.log('handleSave called with editValue:', editValue);
    if (!canEdit) {
      console.log('Cannot edit - canEdit is false');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Calling onSave with value:', editValue);
      await onSave(editValue);
      console.log('onSave completed successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('handleCancel called');
    setIsModalOpen(false);
    setEditValue('');
  };

  // Формируем заголовок модального окна
  const getModalTitle = () => {
    const parts = [];
    if (patientName) parts.push(patientName);
    if (patientChineseName) parts.push(patientChineseName);
    
    if (parts.length > 0) {
      return (
        <>
          <div>{patientTranslations.modals.editNotes.title()}</div>
          <div className="text-sm text-gray-500 font-normal">• {parts.join(' / ')}</div>
        </>
      );
    }
    return patientTranslations.modals.editNotes.title();
  };

  if (!canEdit) {
    return <ExpandableText text={value} maxLength={maxDisplayLength} />;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ExpandableText text={value} maxLength={maxDisplayLength} />
        </div>
        <Edit2 
          className="h-4 w-4 bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 rounded-full p-1 shadow-sm transition-all duration-200 hover:scale-110 cursor-pointer" 
          onClick={handleOpenModal}
        />
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getModalTitle()}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {editValue.length} символов
              </div>
            </div>
            
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Введите особые пожелания о пациенте..."
              className="min-h-[180px] resize-none"
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {patientTranslations.modals.editNotes.cancel()}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? 'Сохранение...' : patientTranslations.modals.editNotes.save()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
