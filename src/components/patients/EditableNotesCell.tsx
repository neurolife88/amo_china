import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ExpandableText from '../ExpandableText';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditIcon, setShowEditIcon] = useState(false);

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
          <div>Особые пожелания</div>
          <div className="text-sm text-gray-500 font-normal">• {parts.join(' / ')}</div>
        </>
      );
    }
    return 'Особые пожелания';
  };

  if (!canEdit) {
    return <ExpandableText text={value} maxLength={maxDisplayLength} />;
  }

  return (
    <>
      <div 
        className="group relative"
        onMouseEnter={() => setShowEditIcon(true)}
        onMouseLeave={() => setShowEditIcon(false)}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ExpandableText text={value} maxLength={maxDisplayLength} />
          </div>
          {showEditIcon && (
            <Edit2 
              className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 cursor-pointer" 
              onClick={handleOpenModal}
            />
          )}
        </div>
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
              placeholder="Введите примечание о пациенте..."
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
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
