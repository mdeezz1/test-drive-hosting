import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, User, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserMenuDialog = ({ open, onOpenChange }: UserMenuDialogProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigation = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {user ? user.name || user.email : "Menu"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full justify-start text-base py-6 border-2"
            onClick={() => handleNavigation("/meus-pedidos")}
          >
            <CreditCard className="mr-3 h-5 w-5" />
            MEUS PEDIDOS
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-base py-6 border-2"
            onClick={() => handleNavigation("/meus-dados")}
          >
            <User className="mr-3 h-5 w-5" />
            MEUS DADOS
          </Button>

          {user ? (
            <Button
              className="w-full text-base py-6 mt-4 bg-red-600 hover:bg-red-700"
              onClick={() => {
                logout();
                onOpenChange(false);
              }}
            >
              <LogOut className="mr-2 h-5 w-5" />
              SAIR
            </Button>
          ) : (
            <Button
              className="w-full text-base py-6 mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleNavigation("/login")}
            >
              <LogIn className="mr-2 h-5 w-5" />
              LOGIN/CADASTRO
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserMenuDialog;
