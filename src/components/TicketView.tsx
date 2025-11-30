import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import guichewebLogoFull from "@/assets/guicheweb-logo-full.png";
import eventCover from "@/assets/event-cover.jpg";

interface TicketItem {
  name: string;
  quantity: number;
  price: number;
}

interface TicketViewProps {
  orderId: string;
  transactionId: string;
  customerName: string;
  customerCpf: string;
  customerEmail: string;
  items: TicketItem[];
  totalAmount: number;
  paidAt: string;
  ticketIndex: number;
  totalTickets: number;
}

const TicketView = ({
  orderId,
  transactionId,
  customerName,
  customerCpf,
  customerEmail,
  items,
  totalAmount,
  paidAt,
  ticketIndex,
  totalTickets,
}: TicketViewProps) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [ticketCode, setTicketCode] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Generate unique codes for each ticket
  useEffect(() => {
    const baseCode = transactionId.replace(/\D/g, '').slice(0, 8);
    const ticketNum = (ticketIndex + 1).toString().padStart(2, '0');
    const uniqueCode = `${baseCode}${Date.now().toString().slice(-4)}${ticketNum}`;
    setTicketCode(uniqueCode);
    setOrderNumber(`${orderId.slice(0, 8).toUpperCase()}/${ticketIndex + 1}`);
  }, [transactionId, ticketIndex, orderId]);

  // Generate QR Code
  useEffect(() => {
    if (qrRef.current && ticketCode) {
      QRCode.toCanvas(qrRef.current, ticketCode, {
        width: 100,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }
  }, [ticketCode]);

  // Generate Barcode
  useEffect(() => {
    if (barcodeRef.current && ticketCode) {
      JsBarcode(barcodeRef.current, ticketCode, {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
      });
    }
  }, [ticketCode]);

  const formatCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return `${numbers.slice(0, 3)}.****${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}*****@${domain}`;
  };

  const paidDate = new Date(paidAt);

  // Event info
  const eventName = "Ahh Verão - Henrique e Juliano + Nattan";
  const eventLocation = "Arena Open, Camboriú - SC";
  const eventDate = "02/01/2025";
  const eventTime = "16:00";

  // Get ticket name from items
  const ticketName = items[0]?.name || "Ingresso";
  const ticketPrice = items[0]?.price || totalAmount;

  return (
    <div className="bg-white text-black p-6 max-w-4xl mx-auto" id={`ticket-${ticketIndex}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600">
            {format(paidDate, "dd/MM/yy, HH:mm", { locale: ptBR })}
          </p>
          <p className="text-sm text-gray-500">E-Ticket - Guichê Web</p>
        </div>
        <img src={guichewebLogoFull} alt="Guichê Web" className="h-10" />
      </div>

      {/* Event Title */}
      <h1 className="text-xl font-bold mb-1">{eventName}</h1>
      <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
        <span className="text-red-500">📍</span> {eventLocation}
      </p>

      {/* Main Ticket Section */}
      <div className="flex gap-4 mb-6">
        {/* Event Banner */}
        <div className="w-48 h-32 overflow-hidden rounded flex-shrink-0">
          <img 
            src={eventCover} 
            alt={eventName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Ticket Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎟️</span>
            <span className="font-bold">{ticketName}</span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            📅 {eventDate}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Abertura:</strong> {eventTime} <strong>Início:</strong> {eventTime}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Valor: R$ {ticketPrice.toFixed(2).replace('.', ',')}
          </p>

          <div className="border-t pt-2 mt-2">
            <p className="text-sm text-gray-600">Favorecido:</p>
            <p className="font-bold text-green-600">{customerName}</p>
            <p className="text-sm text-gray-600">CPF: {formatCPF(customerCpf)}</p>
            <p className="text-sm text-gray-600">{formatEmail(customerEmail)}</p>
          </div>
        </div>

        {/* QR Code and Order Info */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-600">Pedido: {orderNumber}</p>
          <p className="text-xs text-gray-600">Código: {ticketCode}</p>
          <p className="text-xs text-gray-600 mb-2">
            Data da compra: {format(paidDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
          <canvas ref={qrRef} className="ml-auto" />
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-2 gap-8 mb-6 border-t pt-4">
        <div>
          <p className="font-bold mb-2">PEDIDO: {orderNumber}</p>
          <p className="text-sm">{ticketName}</p>
          <p className="text-sm text-gray-600">
            Valor: R$ {ticketPrice.toFixed(2).replace('.', ',')}
          </p>
          <p className="text-sm text-gray-600">
            Data da compra: {format(paidDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div>
          <p className="font-bold mb-2">CÓDIGO: {ticketCode}</p>
          <p className="text-sm">{customerName}</p>
          <p className="text-sm text-gray-600">CPF: {formatCPF(customerCpf)}</p>
          <p className="text-sm text-gray-600">{formatEmail(customerEmail)}</p>
        </div>
      </div>

      {/* Important Section */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3">IMPORTANTE</h2>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Ao imprimir, certifique-se que a área com o código de barras está legível e em perfeito estado.</li>
          <li>• Um documento com foto (RG, CNH) do titular informado neste ingresso poderá ser solicitado na portaria.</li>
          <li>• Não nos responsabilizamos por ingressos comprados de terceiros, bem como por cópias indevidas deste e-Ticket.</li>
          <li>• <strong>Este ingresso é válido para o portador dele em PDF ou impresso, com documento (RG, CNH) em mãos. Qualquer pessoa com este ingresso poderá utilizá-lo na entrada.</strong></li>
        </ul>
      </div>

      {/* Barcode */}
      <div className="flex flex-col items-center mt-8 border-t pt-6">
        <svg ref={barcodeRef} className="w-72" />
        <p className="text-red-600 font-bold text-sm mt-4 text-center">
          ATENÇÃO: NUNCA IMPRIMA SEM CÓDIGO DE BARRAS VISÍVEL
        </p>
      </div>
    </div>
  );
};

export default TicketView;
