import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface ViewImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ViewImageModal = ({
  isOpen,
  onClose,
  imageUrl,
}: ViewImageModalProps) => {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setImage(imageUrl);
    }
  }, [isOpen, imageUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[70vw] max-h-[90vh] p-4 flex flex-col overflow-hidden">

        {image && (
          <div className="flex justify-center items-center flex-1 overflow-hidden ">
            <img
              src={image}
              alt="View Image"
              className="max-h-full max-w-full object-contain rounded-lg "
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
