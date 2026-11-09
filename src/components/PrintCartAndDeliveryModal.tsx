import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgePercent,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  FilePlus2,
  FileText,
  Gift,
  Home,
  Loader2,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Printer,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  CartDocumentItem,
  computeCartPricingAndOffers,
  HomePrinterPartner,
  OnlinePrintDeliveryOrder,
  OwnerBusinessConfig,
  PrintPaperType,
} from '../types/documents';

interface PrintCartAndDeliveryModalProps {
  isOpen: boolean;
  initialTab?: 'cart' | 'home_delivery' | 'partner_hub';
  cartItems: CartDocumentItem[];
  ownerConfig: OwnerBusinessConfig;
  currentDocumentTitle: string;
  onClose: () => void;
  onAddCurrentDocumentToCart: () => void;
  onUpdateCartItem: (id: string, patch: Partial<CartDocumentItem>) => void;
  onRemoveCartItem: (id: string) => void;
  onClearCart: () => void;
  onLoadCartItemToEditor: (item: CartDocumentItem, andPrint?: boolean) => void;
  onRequestCombinedCartCheckout: (
    discountedAmount: number,
    onSuccessUnlockAll: () => void
  ) => void;
  onDownloadAllUnlockedCartPdfs: () => void;
  onShowToast: (msg: string) => void;
}

const PAPER_TYPE_LABELS: Record<PrintPaperType, string> = {
  normal_a4: 'സാധാരണ A4 പേപ്പർ (75 GSM)',
  bond_85gsm: 'ഔദ്യോഗിക ബോണ്ട് പേപ്പർ (85 GSM +₹2)',
  color_photo_cv: 'കളർ പ്രിന്റ് — ബയോഡാറ്റ / CV (+₹5)',
  kerala_stamp_paper: 'മുദ്രപ്പത്രം ഹെഡർ ഗ്യാപ്പ് പ്രിന്റ് (+₹3)',
};

export const PrintCartAndDeliveryModal: React.FC<PrintCartAndDeliveryModalProps> = ({
  isOpen,
  initialTab = 'cart',
  cartItems,
  ownerConfig,
  currentDocumentTitle,
  onClose,
  onAddCurrentDocumentToCart,
  onUpdateCartItem,
  onRemoveCartItem,
  onClearCart,
  onLoadCartItemToEditor,
  onRequestCombinedCartCheckout,
  onDownloadAllUnlockedCartPdfs,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'home_delivery' | 'partner_hub'>(initialTab);
  const [couponCode, setCouponCode] = useState<string>('');
  const [partners, setPartners] = useState<HomePrinterPartner[]>([]);
  const [orders, setOrders] = useState<OnlinePrintDeliveryOrder[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState<boolean>(false);

  // Home Delivery Booking Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('hp-kerala-1');
  const [deliveryMode, setDeliveryMode] = useState<'HOME_DELIVERY' | 'SELF_PICKUP'>('HOME_DELIVERY');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [panchayatOrLandmark, setPanchayatOrLandmark] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [paymentChoice, setPaymentChoice] = useState<'ONLINE_UPI' | 'CASH_ON_DELIVERY'>('ONLINE_UPI');
  const [createdOrderSuccess, setCreatedOrderSuccess] = useState<OnlinePrintDeliveryOrder | null>(
    null
  );
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Home Printer Partner Registration Form State
  const [showRegisterPartnerForm, setShowRegisterPartnerForm] = useState<boolean>(false);
  const [newUnitName, setNewUnitName] = useState<string>('');
  const [newOperatorName, setNewOperatorName] = useState<string>('');
  const [newPartnerPhone, setNewPartnerPhone] = useState<string>('');
  const [newDistrict, setNewDistrict] = useState<string>('കണ്ണൂർ / കോഴിക്കോട്');
  const [newPanchayat, setNewPanchayat] = useState<string>('');
  const [newPincode, setNewPincode] = useState<string>('');
  const [newDeliveryCharge, setNewDeliveryCharge] = useState<number>(10);
  const [newHasColorPrinter, setNewHasColorPrinter] = useState<boolean>(true);
  const [newHasHomeDelivery, setNewHasHomeDelivery] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCreatedOrderSuccess(null);
      fetchPrintNetworkData();
    }
  }, [isOpen, initialTab]);

  const fetchPrintNetworkData = async () => {
    setIsLoadingNetwork(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/print-network/partners').then((r) => r.json()),
        fetch('/api/print-network/orders').then((r) => r.json()),
      ]);
      if (Array.isArray(pRes?.partners) && pRes.partners.length > 0) {
        setPartners(pRes.partners);
        if (!selectedPartnerId) {
          setSelectedPartnerId(pRes.partners[0].id);
        }
      }
      if (Array.isArray(oRes?.orders)) {
        setOrders(oRes.orders);
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      setIsLoadingNetwork(false);
    }
  };

  if (!isOpen) return null;

  const isBusinessModeEnabled = Boolean(ownerConfig.homePrinterBusinessModeEnabled);
  const offerSummary = computeCartPricingAndOffers(cartItems, couponCode, isBusinessModeEnabled);
  const allItemsUnlocked =
    ownerConfig.freeModeEnabled ||
    (cartItems.length > 0 && cartItems.every((item) => item.isPaidAndUnlocked));

  const selectedPartner =
    partners.find((p) => p.id === selectedPartnerId) || partners[0] || null;

  // Delivery fee is FREE if 10+ files/copies are ordered (Mega 10-File Pack Offer!) or if SELF_PICKUP
  const rawDeliveryFee =
    deliveryMode === 'SELF_PICKUP' ? 0 : selectedPartner?.deliveryCharge ?? 15;
  const effectiveDeliveryFee =
    Math.max(offerSummary.totalFiles, offerSummary.totalCopies) >= 10 ? 0 : rawDeliveryFee;

  const finalHomeDeliveryTotal = offerSummary.netDigitalAmount + effectiveDeliveryFee;

  const handleCombinedDigitalPayAndDownload = () => {
    if (cartItems.length === 0) {
      onShowToast('ദയവായി ആദ്യം ഒരു ഫയലെങ്കിലും കാർട്ടിലേക്ക് ചേർക്കുക.');
      return;
    }
    if (allItemsUnlocked) {
      onDownloadAllUnlockedCartPdfs();
      return;
    }
    onRequestCombinedCartCheckout(offerSummary.netDigitalAmount, () => {
      onDownloadAllUnlockedCartPdfs();
    });
  };

  const handleCreateHomeDeliveryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      onShowToast('കാർട്ടിൽ ഫയലുകൾ ഒന്നുമില്ല! ആദ്യം ഫയൽ കാർട്ടിലേക്ക് ചേർക്കുക.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      onShowToast('നിങ്ങളുടെ പേരും ഫോൺ നമ്പറും ദയവായി നൽകുക.');
      return;
    }
    if (deliveryMode === 'HOME_DELIVERY' && !customerAddress.trim()) {
      onShowToast('വീട്ടുപേരും ഡെലിവറി വിലാസവും നൽകുക.');
      return;
    }

    const submitOrderToBackend = async (paidStatus: 'PAID' | 'PENDING_COD') => {
      setIsSubmittingOrder(true);
      try {
        const res = await fetch('/api/print-network/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerAddress: customerAddress.trim(),
            panchayatOrLandmark: panchayatOrLandmark.trim(),
            pincode: pincode.trim(),
            deliveryMode,
            selectedPartnerId: selectedPartner?.id || 'hp-kerala-1',
            selectedPartnerName:
              selectedPartner?.unitName || 'അപേക്ഷാ ഡെസ്ക് ഹോം പ്രിന്റ് & ഡെലിവറി ഹബ്',
            selectedPartnerPhone: selectedPartner?.whatsapp || ownerConfig.whatsappNumber,
            items: cartItems,
            totalFiles: offerSummary.totalFiles,
            totalCopies: offerSummary.totalCopies,
            subtotalAmount: offerSummary.grossAmount,
            discountPercent: offerSummary.discountPercent,
            discountAmount: offerSummary.discountAmount,
            offerTitleMalayalam: offerSummary.activeOfferTitleMalayalam,
            deliveryFee: effectiveDeliveryFee,
            finalPayableAmount: finalHomeDeliveryTotal,
            paymentMethod: paymentChoice,
            paymentStatus: paidStatus,
          }),
        });
        const data = await res.json();
        if (data?.order) {
          setCreatedOrderSuccess(data.order);
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
          onShowToast(
            `🎉 നിങ്ങളുടെ ${offerSummary.totalFiles} ഫയലുകളുടെ പ്രിന്റ് & ഡെലിവറി ഓർഡർ (#${data.order.orderId}) ബുക്ക് ചെയ്തു!`
          );
        }
      } catch {
        onShowToast('ഓർഡർ അയക്കുന്നതിൽ ചെറിയ തടസ്സം നേരിട്ടു. വീണ്ടും ശ്രമിക്കുക.');
      } finally {
        setIsSubmittingOrder(false);
      }
    };

    if (paymentChoice === 'ONLINE_UPI' && !allItemsUnlocked) {
      onRequestCombinedCartCheckout(finalHomeDeliveryTotal, () => {
        submitOrderToBackend('PAID');
      });
    } else {
      submitOrderToBackend(allItemsUnlocked ? 'PAID' : 'PENDING_COD');
    }
  };

  const handleRegisterNewPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newPartnerPhone.trim()) {
      onShowToast('യൂണിറ്റിന്റെ പേരും ഫോൺ നമ്പറും നൽകുക.');
      return;
    }
    try {
      const printerTypes = ['B/W Laser A4'];
      if (newHasColorPrinter) printerTypes.push('Color InkTank (CV)');
      printerTypes.push('85 GSM Bond Paper');

      const res = await fetch('/api/print-network/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitName: newUnitName.trim(),
          operatorName: newOperatorName.trim() || 'ഹോം പ്രിന്റ് പാർട്ണർ',
          phone: newPartnerPhone.trim(),
          whatsapp: newPartnerPhone.trim(),
          district: newDistrict.trim(),
          panchayatOrTown: newPanchayat.trim() || 'എല്ലാ വാർഡുകളും',
          pincode: newPincode.trim() || '670001',
          printerTypes,
          homeDeliveryAvailable: newHasHomeDelivery,
          deliveryCharge: newDeliveryCharge,
        }),
      });
      const data = await res.json();
      if (data?.partners) {
        setPartners(data.partners);
        if (data.partner?.id) {
          setSelectedPartnerId(data.partner.id);
        }
        setShowRegisterPartnerForm(false);
        setNewUnitName('');
        setNewOperatorName('');
        setNewPartnerPhone('');
        onShowToast('✓ നിങ്ങളുടെ വീട്ടിലെ പ്രിന്റർ യൂണിറ്റ് ഓൺലൈൻ നെറ്റ്‌വർക്കിൽ രജിസ്റ്റർ ചെയ്തു!');
      }
    } catch {
      onShowToast('രജിസ്റ്റർ ചെയ്യുന്നതിൽ തടസ്സം നേരിട്ടു.');
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    nextStatus: OnlinePrintDeliveryOrder['orderStatus']
  ) => {
    try {
      const res = await fetch(`/api/print-network/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: nextStatus }),
      });
      const data = await res.json();
      if (Array.isArray(data?.orders)) {
        setOrders(data.orders);
        onShowToast(`✓ ഓർഡർ #${orderId} സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്തു!`);
      }
    } catch {
      // Ignore
    }
  };

  const sendOrderToPartnerWhatsApp = (order: OnlinePrintDeliveryOrder) => {
    const cleanPhone = (order.selectedPartnerPhone || ownerConfig.whatsappNumber || '').replace(
      /[^\d]/g,
      ''
    );
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const filesList = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.title} (${it.copies} കോപ്പി - ${PAPER_TYPE_LABELS[it.paperType] || 'A4'})`
      )
      .join('\n');

    const msg = `🖨️ *പുതിയ ഒരുമിച്ച് പ്രിന്റ് & ഹോം ഡെലിവറി ഓർഡർ (${order.orderId})*\n\n👤 പേര്: ${
      order.customerName
    }\n📞 ഫോൺ: ${order.customerPhone}\n📍 വിലാസം: ${order.customerAddress} (${
      order.panchayatOrLandmark
    } - ${order.pincode})\n🚚 രീതി: ${
      order.deliveryMode === 'HOME_DELIVERY' ? 'വീട്ടിൽ എത്തിച്ചു നൽകുക (Home Delivery)' : 'നേരിട്ട് വന്ന് വാങ്ങും'
    }\n\n📄 *പ്രിന്റ് ചെയ്യേണ്ട ഫയലുകൾ (${order.totalFiles} എണ്ണം):*\n${filesList}\n\n💰 ആകെ തുക: ₹${
      order.finalPayableAmount
    } (${order.paymentStatus === 'PAID' ? 'Online Paid ✓' : 'Cash on Delivery'})`;

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={onClose}
      className="no-print fixed inset-0 z-[95] flex items-start justify-center bg-slate-950/75 backdrop-blur-xs pt-2 sm:pt-5 p-2 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white border-b border-emerald-800/50">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-malayalam font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>തിരികെ</span>
          </button>

          <div className="min-w-0 text-center flex-1">
            <h2 className="font-malayalam font-black text-sm sm:text-base text-white truncate">
              {ownerConfig.freeModeEnabled
                ? '🛒 PDF കാർട്ട് & ഒരുമിച്ച് സൗജന്യ ഡൗൺലോഡ്'
                : isBusinessModeEnabled
                ? '🛒 പ്രിന്റ് കാർട്ട് · ബൾക്ക് ഓഫർ · ഹോം പ്രിന്റർ ഡെലിവറി'
                : '🛒 PDF കാർട്ട് & ഒരുമിച്ച് ഡൗൺലോഡ് (Batch PDF Download)'}
            </h2>
            <p className="font-malayalam text-[11px] text-emerald-300 truncate">
              {ownerConfig.freeModeEnabled
                ? '10 ഫയലുകൾ വരെ ഒരുമിച്ച് കാർട്ടിലിട്ട് ഒറ്റ ക്ലിക്കിൽ എല്ലാ A4 PDF ഫയലുകളും സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യാം!'
                : isBusinessModeEnabled
                ? '10 ഫയലുകൾ വരെ ഒരുമിച്ച് കാർട്ടിലിട്ട് ഒറ്റ പേയ്‌മെന്റിൽ എടുക്കാം · വീട്ടിലെ പ്രിന്റർ വഴി ഡെലിവറിയും!'
                : '10 ഫയലുകൾ വരെ ഒരുമിച്ച് കാർട്ടിലിട്ട് ഒറ്റ പേയ്‌മെന്റിൽ എല്ലാ A4 PDF ഫയലുകളും ഡൗൺലോഡ് ചെയ്യാം!'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-white/10 hover:bg-red-600 text-white border border-white/15 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Shows 3 tabs if Home Printer Business Mode is ON, or 1 clean tab if OFF) */}
        {isBusinessModeEnabled && (
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`min-h-[44px] px-2 py-2 rounded-xl font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'cart'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {ownerConfig.freeModeEnabled
                  ? `1. കാർട്ട് (${cartItems.length})`
                  : `1. കാർട്ട് (${cartItems.length}) & ഓഫർ`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('home_delivery')}
              className={`min-h-[44px] px-2 py-2 rounded-xl font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'home_delivery'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span className="truncate">2. ഹോം പ്രിന്റ് ഡെലിവറി</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('partner_hub')}
              className={`min-h-[44px] px-2 py-2 rounded-xl font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'partner_hub'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <Printer className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">3. വീട്ടിലെ പ്രിന്റർ ഹബ് ({orders.length})</span>
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* ================================================================
              TAB 1: MULTI-DOCUMENT PRINT CART & BULK OFFERS
             ================================================================ */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              {/* Quick Add Current Document Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-malayalam font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-950 mb-1">
                    ഇപ്പോൾ എഡിറ്ററിലുള്ള ഫയൽ
                  </span>
                  <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    📄 {currentDocumentTitle || 'ഔദ്യോഗിക അപേക്ഷ'}
                  </h4>
                  <p className="font-malayalam text-[11px] text-slate-600">
                    {ownerConfig.freeModeEnabled
                      ? 'ഈ ഫയൽ കാർട്ടിലേക്ക് ഇട്ട ശേഷം അടുത്ത ഫയൽ നിർമ്മിക്കാം. അവസാനം എല്ലാം കൂടി ഒറ്റ ക്ലിക്കിൽ സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യാം!'
                      : 'ഈ ഫയൽ കാർട്ടിലേക്ക് ഇട്ട ശേഷം അടുത്ത ഫയൽ നിർമ്മിക്കാം. അവസാനം എല്ലാം കൂടി ഒറ്റ തവണ പേയ്‌മെന്റ് ചെയ്താൽ മതി!'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onAddCurrentDocumentToCart}
                    className="btn-round-3d min-h-[42px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <FilePlus2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>+ ഈ ഫയൽ കാർട്ടിലിടുക</span>
                  </button>
                </div>
              </div>

              {/* Bulk Discount / Offer Tier Progress Card (ONLY shown when Payment Mode is ON / Free Mode is OFF) */}
              {!ownerConfig.freeModeEnabled && (
                <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                      <span className="font-malayalam font-black text-xs sm:text-sm text-amber-950">
                        {offerSummary.activeOfferTitleMalayalam}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-mono-num font-black text-xs">
                        {offerSummary.discountPercent}% OFF
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-amber-200/70 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${offerSummary.progressToNextTierPercent}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 transition-all duration-300"
                    />
                  </div>

                  <p className="font-malayalam text-xs font-bold text-amber-900">
                    {offerSummary.nextOfferHintMalayalam}
                  </p>

                  {/* Tier Badges + 1-Tap Promo Coupons */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        Math.max(offerSummary.totalFiles, offerSummary.totalCopies) >= 3
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : 'bg-white/80 border-amber-200 text-slate-700'
                      }`}
                    >
                      <p className="font-mono-num font-black text-xs">3+ ഫയൽ</p>
                      <p className="font-malayalam text-[11px] font-bold">10% കിഴിവ്</p>
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        Math.max(offerSummary.totalFiles, offerSummary.totalCopies) >= 5
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : 'bg-white/80 border-amber-200 text-slate-700'
                      }`}
                    >
                      <p className="font-mono-num font-black text-xs">5+ ഫയൽ</p>
                      <p className="font-malayalam text-[11px] font-bold">20% കിഴിവ്</p>
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        Math.max(offerSummary.totalFiles, offerSummary.totalCopies) >= 10
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950'
                          : 'bg-white/80 border-amber-200 text-slate-700'
                      }`}
                    >
                      <p className="font-mono-num font-black text-xs">10+ ഫയൽ</p>
                      <p className="font-malayalam text-[11px] font-bold">
                        {isBusinessModeEnabled ? '30% + Free Delivery' : '30% മെഗാ കിഴിവ്'}
                      </p>
                    </div>
                  </div>

                  {/* Quick 1-Tap Coupon Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-malayalam text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <BadgePercent className="w-3.5 h-3.5 text-emerald-700" />
                      <span>സ്പെഷ്യൽ കൂപ്പണുകൾ:</span>
                    </span>
                    {[
                      { code: 'KERALA15', label: 'KERALA15 (15% Off)' },
                      { code: 'BULK25', label: 'BULK25 (25% Off)' },
                      { code: 'MEGA30', label: 'MEGA30 (30% Off - 2+ ഫയൽ)' },
                    ].map((cp) => (
                      <button
                        key={cp.code}
                        type="button"
                        onClick={() => {
                          setCouponCode(couponCode === cp.code ? '' : cp.code);
                          onShowToast(`🎟️ "${cp.code}" ഓഫർ കൂപ്പൺ തിരഞ്ഞെടുത്തു!`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-num font-bold cursor-pointer border transition-all ${
                          couponCode === cp.code
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-white hover:bg-amber-100 text-slate-800 border-amber-300'
                        }`}
                      >
                        {cp.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              {cartItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 space-y-3">
                  <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-malayalam font-extrabold text-sm text-slate-800">
                    നിങ്ങളുടെ PDF കാർട്ട് ഇപ്പോൾ കാലിയാണ്
                  </h3>
                  <p className="font-malayalam text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    നിങ്ങൾ തയ്യാറാക്കുന്ന ഓരോ അപേക്ഷയും ബയോഡാറ്റയും <strong>&ldquo;+ ഈ ഫയൽ കാർട്ടിലിടുക&rdquo;</strong> ബട്ടൺ അമർത്തി കാർട്ടിലേക്ക് മാറ്റുക.{' '}
                    {ownerConfig.freeModeEnabled
                      ? '10 ഫയലുകൾ വരെ ഒരുമിച്ച് ചേർത്ത് ഒറ്റ ക്ലിക്കിൽ സൗജന്യമായി ഡൗൺലോഡ് ചെയ്യാം!'
                      : '10 ഫയലുകൾ വരെ ഒരുമിച്ച് ചേർത്ത് ഒറ്റ തവണ പേയ്‌മെന്റ് ചെയ്യാം!'}
                  </p>
                  <button
                    type="button"
                    onClick={onAddCurrentDocumentToCart}
                    className="min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ഇപ്പോഴത്തെ പേപ്പർ കാർട്ടിലേക്ക് ചേർക്കുക</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                      {isBusinessModeEnabled
                        ? `കാർട്ടിലുള്ള ഫയലുകൾ (${cartItems.length} എണ്ണം · ആകെ ${offerSummary.totalCopies} കോപ്പി)`
                        : `കാർട്ടിലുള്ള ഫയലുകൾ (${cartItems.length} എണ്ണം)`}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-malayalam font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>അടുത്ത ഫയൽ കൂടി നിർമ്മിക്കാം</span>
                      </button>
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-malayalam font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>എല്ലാം മാറ്റുക</span>
                      </button>
                    </div>
                  </div>

                  {cartItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 hover:border-emerald-400 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 font-mono-num font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h5 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {item.title}
                            </h5>
                            {ownerConfig.freeModeEnabled ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-malayalam font-bold text-[10px]">
                                🎁 സൗജന്യം
                              </span>
                            ) : (
                              <>
                                <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-mono-num font-bold text-[10px]">
                                  ₹{item.basePrice}
                                </span>
                                {item.isPaidAndUnlocked && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-malayalam font-bold text-[10px]">
                                    ✓ Paid
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <p className="font-malayalam text-[11px] text-slate-500 truncate">
                            {item.subtitle} · 🕒 {item.createdAt}
                          </p>

                          {/* Paper Type Selector (Only shown when Home Printer Business Mode is ON) */}
                          {isBusinessModeEnabled && (
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <select
                                aria-label="പേപ്പർ തരം"
                                value={item.paperType}
                                onChange={(e) =>
                                  onUpdateCartItem(item.id, {
                                    paperType: e.target.value as PrintPaperType,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-malayalam text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                              >
                                {Object.entries(PAPER_TYPE_LABELS).map(([k, label]) => (
                                  <option key={k} value={k}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Copies & Actions */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                        {/* Copies Counter (Only shown when Home Printer Business Mode is ON) */}
                        {isBusinessModeEnabled && (
                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-1.5 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateCartItem(item.id, {
                                  copies: Math.max(1, (item.copies || 1) - 1),
                                })
                              }
                              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 cursor-pointer"
                              title="കോപ്പി കുറയ്ക്കുക"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 font-mono-num font-black text-xs text-slate-900">
                              {item.copies || 1} കോപ്പി
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateCartItem(item.id, {
                                  copies: Math.min(50, (item.copies || 1) + 1),
                                })
                              }
                              className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center text-emerald-900 cursor-pointer"
                              title="കോപ്പി കൂട്ടുക"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onLoadCartItemToEditor(item, false);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-malayalam font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          title="എഡിറ്ററിൽ തുറന്ന് തിരുത്തുക"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>തുറക്കുക</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRemoveCartItem(item.id)}
                          className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          title="കാർട്ടിൽ നിന്ന് മാറ്റുക"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Combined Bill Summary & 2 Checkout Options */}
              {cartItems.length > 0 && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                  {ownerConfig.freeModeEnabled ? (
                    <div className="flex justify-between items-center text-sm sm:text-base font-malayalam font-extrabold text-white border-b border-slate-700 pb-3">
                      <span>ആകെ ഫയലുകൾ ({offerSummary.totalFiles} A4 PDF ഫയൽ):</span>
                      <span className="text-emerald-400">🎁 പൂർണ്ണമായും സൗജന്യം (₹0)</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs font-malayalam border-b border-slate-700 pb-3">
                      <div className="flex justify-between text-slate-300">
                        <span>
                          {isBusinessModeEnabled
                            ? `ആകെ ഫയലുകൾ (${offerSummary.totalFiles} ഫയൽ · ${offerSummary.totalCopies} കോപ്പി):`
                            : `ആകെ ഫയലുകൾ (${offerSummary.totalFiles} A4 PDF ഫയൽ):`}
                        </span>
                        <span className="font-mono-num font-bold">₹{offerSummary.grossAmount}.00</span>
                      </div>
                      {offerSummary.discountAmount > 0 && (
                        <div className="flex justify-between text-amber-400 font-bold">
                          <span>
                            🎁 ബൾക്ക് ഓഫർ കിഴിവ് ({offerSummary.discountPercent}% OFF):
                          </span>
                          <span className="font-mono-num">- ₹{offerSummary.discountAmount}.00</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base sm:text-lg font-extrabold text-white pt-1">
                        <span>ഒരുമിച്ച് അടയ്ക്കേണ്ട തുക:</span>
                        <span className="font-mono-num text-emerald-400">
                          ₹{offerSummary.netDigitalAmount}.00
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`grid grid-cols-1 ${
                      isBusinessModeEnabled ? 'sm:grid-cols-2' : ''
                    } gap-3`}
                  >
                    {/* Option 1: Pay Once & Download All PDFs */}
                    <button
                      type="button"
                      onClick={handleCombinedDigitalPayAndDownload}
                      className="min-h-[50px] px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Download className="w-4 h-4 stroke-[2.8] shrink-0" />
                      <span>
                        {allItemsUnlocked
                          ? `✓ എല്ലാ ${cartItems.length} PDF ഫയലുകളും ഒരുമിച്ച് ഡൗൺലോഡ് ചെയ്യുക`
                          : `⚡ ₹${offerSummary.netDigitalAmount} ഒറ്റ തവണ അടച്ച് ${cartItems.length} PDF-ഉം ഒരുമിച്ച് എടുക്കുക`}
                      </span>
                    </button>

                    {/* Option 2: Send Batch to Nearby Home Printer for Print & Delivery */}
                    {isBusinessModeEnabled && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('home_delivery')}
                        className="min-h-[50px] px-4 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Truck className="w-4 h-4 stroke-[2.5] shrink-0" />
                        <span>🏠 വീട്ടിലെ പ്രിന്റർ വഴി പ്രിന്റ് ചെയ്ത് വീട്ടിലെത്തിക്കാൻ →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 2: HOME PRINTER NETWORK & DOORSTEP DELIVERY BOOKING
             ================================================================ */}
          {activeTab === 'home_delivery' && (
            <div className="space-y-4">
              {createdOrderSuccess ? (
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-5 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg">
                    <PackageCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-200 text-emerald-950 font-mono-num font-black text-xs">
                      ORDER ID: #{createdOrderSuccess.orderId}
                    </span>
                    <h3 className="font-malayalam font-black text-base sm:text-lg text-slate-900 pt-1">
                      🎉 നിങ്ങളുടെ ഒരുമിച്ചുള്ള പ്രിന്റ് & ഡെലിവറി ഓർഡർ സ്വീകരിച്ചു!
                    </h3>
                    <p className="font-malayalam text-xs text-slate-700 max-w-md mx-auto">
                      തിരഞ്ഞെടുത്ത പ്രിന്റർ യൂണിറ്റ്: <strong>{createdOrderSuccess.selectedPartnerName}</strong> ({createdOrderSuccess.totalFiles} ഫയലുകൾ · {createdOrderSuccess.totalCopies} കോപ്പി)
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => sendOrderToPartnerWhatsApp(createdOrderSuccess)}
                      className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>📲 പ്രിന്റ് യൂണിറ്റിലേക്ക് WhatsApp സന്ദേശം അയക്കുക</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCreatedOrderSuccess(null);
                        setActiveTab('partner_hub');
                      }}
                      className="w-full sm:w-auto min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 text-white font-malayalam font-bold text-xs cursor-pointer"
                    >
                      ലൈവ് ഓർഡർ സ്റ്റാറ്റസ് കാണുക →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateHomeDeliveryOrder} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-3">
                    <Home className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs font-malayalam text-amber-950 space-y-1">
                      <p className="font-extrabold text-sm">
                        🏠 വീട്ടിലെ പ്രിന്റർ വഴി ഒരുമിച്ച് പ്രിന്റ് & ഹോം ഡെലിവറി
                      </p>
                      <p className="leading-relaxed text-amber-900">
                        നിങ്ങളുടെ വീട്ടിൽ പ്രിന്റർ ഇല്ലെങ്കിലും പേടിക്കേണ്ട! കാർട്ടിലിട്ട 1 മുതൽ 10+ വരെയുള്ള എല്ലാ ഫയലുകളും തൊട്ടടുത്ത വീട്ടിലെ പ്രിന്റർ യൂണിറ്റിൽ നിന്ന് മനോഹരമായി പ്രിന്റ് ചെയ്ത് ഒറ്റ കവറിലാക്കി നിങ്ങളുടെ വീട്ടിൽ എത്തിച്ചു തരും.
                      </p>
                    </div>
                  </div>

                  {/* Step 1: Select Nearby Home Printer Partner */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                        1. തൊട്ടടുത്ത ഹോം പ്രിന്റർ യൂണിറ്റ് തിരഞ്ഞെടുക്കുക:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('partner_hub');
                          setShowRegisterPartnerForm(true);
                        }}
                        className="text-[11px] font-malayalam font-extrabold text-emerald-700 hover:underline cursor-pointer"
                      >
                        + നിങ്ങളുടെ വീട്ടിലെ പ്രിന്റർ ചേർക്കണോ?
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {partners.map((partner) => {
                        const isSelected = partner.id === (selectedPartner?.id || '');
                        return (
                          <div
                            key={partner.id}
                            onClick={() => setSelectedPartnerId(partner.id)}
                            className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                              isSelected
                                ? 'bg-emerald-50/90 border-emerald-600 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                                  {partner.unitName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono-num font-bold text-[10px] flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  {partner.rating}
                                </span>
                              </div>
                              <p className="font-malayalam text-[11px] text-slate-600">
                                📍 {partner.panchayatOrTown} ({partner.district} - {partner.pincode}) · 👤 {partner.operatorName}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {(partner.printerTypes || []).map((pt) => (
                                  <span
                                    key={pt}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono-num text-[10px] font-semibold"
                                  >
                                    🖨️ {pt}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="text-left sm:text-right shrink-0">
                              <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-700 text-white font-malayalam font-extrabold text-[11px]">
                                ഡെലിവറി: ₹{partner.deliveryCharge} ({partner.deliveryRadiusKm} km)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Delivery vs Self Pickup */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setDeliveryMode('HOME_DELIVERY')}
                      className={`p-3 rounded-2xl border-2 font-malayalam text-left cursor-pointer transition-all ${
                        deliveryMode === 'HOME_DELIVERY'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <p className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>🏠 വീട്ടിൽ എത്തിച്ചു നൽകുക</span>
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        എല്ലാ പ്രിന്റുകളും ഒരുമിച്ച് കവറിലാക്കി വീട്ടിലെത്തിക്കും (10+ ഫയലിന് Free Delivery!)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMode('SELF_PICKUP')}
                      className={`p-3 rounded-2xl border-2 font-malayalam text-left cursor-pointer transition-all ${
                        deliveryMode === 'SELF_PICKUP'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <p className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>🚶 നേരിട്ട് വന്ന് വാങ്ങുക</span>
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        തൊട്ടടുത്ത വീട്ടിലെ പ്രിന്റർ യൂണിറ്റിൽ നിന്ന് നേരിട്ട് കൈപ്പറ്റാം (ഡെലിവറി ചാർജ് ഇല്ല)
                      </p>
                    </button>
                  </div>

                  {/* Step 3: Customer Address Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                      2. പ്രിന്റ് എത്തിക്കേണ്ട വിലാസവും ഫോൺ നമ്പറും:
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-malayalam text-xs font-bold text-slate-700 mb-1">
                          നിങ്ങളുടെ പേര് *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="ഉദാ: അബ്ദുൾ റഹ്മാൻ / സുരേഷ്"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-malayalam text-xs font-bold text-slate-700 mb-1">
                          മൊബൈൽ / WhatsApp നമ്പർ *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="ഉദാ: 9847000000"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-slate-300 font-mono-num text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-malayalam text-xs font-bold text-slate-700 mb-1">
                          വീട്ടുപേരും വിലാസവും (House Name & Road) *
                        </label>
                        <input
                          type="text"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="ഉദാ: ബൈത്തുൽ നൂർ, വാർഡ് 7, സ്കൂൾ റോഡ്"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-malayalam text-xs font-bold text-slate-700 mb-1">
                          പിൻകോഡ് & സ്ഥലം
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="ഉദാ: 670702, കൊളാരി"
                          className="w-full min-h-[42px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Payment Choice & Total Summary */}
                  <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('ONLINE_UPI')}
                        className={`p-2.5 rounded-xl border text-xs font-malayalam font-extrabold cursor-pointer ${
                          paymentChoice === 'ONLINE_UPI'
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        📲 Google Pay / UPI (ഒരുമിച്ച്)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentChoice('CASH_ON_DELIVERY')}
                        className={`p-2.5 rounded-xl border text-xs font-malayalam font-extrabold cursor-pointer ${
                          paymentChoice === 'CASH_ON_DELIVERY'
                            ? 'bg-amber-500 border-amber-300 text-slate-950'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        💵 പ്രിന്റ് കിട്ടുമ്പോൾ പണം നൽകാം (COD)
                      </button>
                    </div>

                    <div className="text-xs font-malayalam space-y-1 pt-1 border-t border-slate-700">
                      <div className="flex justify-between text-slate-300">
                        <span>
                          പ്രിന്റ് നിരക്ക് ({offerSummary.totalFiles} ഫയൽ · {offerSummary.totalCopies} കോപ്പി):
                        </span>
                        <span className="font-mono-num">₹{offerSummary.netDigitalAmount}.00</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>ഹോം ഡെലിവറി ചാർജ്:</span>
                        <span className="font-mono-num text-emerald-400">
                          {effectiveDeliveryFee === 0 ? 'FREE (സൗജന്യം!)' : `₹${effectiveDeliveryFee}.00`}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-black text-white pt-1">
                        <span>ആകെ അടയ്ക്കേണ്ടത്:</span>
                        <span className="font-mono-num text-amber-400">
                          ₹{finalHomeDeliveryTotal}.00
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-malayalam font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      {isSubmittingOrder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PackageCheck className="w-5 h-5" />
                      )}
                      <span>
                        ✓ {offerSummary.totalFiles} ഫയലുകളും ഒരുമിച്ച് പ്രിന്റ് & ഡെലിവറി ബുക്ക് ചെയ്യുക
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 3: HOME PRINTER PARTNER REGISTRATION & LIVE BATCH ORDERS
             ================================================================ */}
          {activeTab === 'partner_hub' && (
            <div className="space-y-5">
              {/* Top Callout: Register Your Home Printer */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-malayalam font-black text-[10px]">
                    വീട്ടിലിരുന്ന് വരുമാനം നേടാം (Home Printer Network)
                  </span>
                  <h3 className="font-malayalam font-extrabold text-sm sm:text-base">
                    🖨️ നിങ്ങളുടെ വീട്ടിലോ കടയിലോ ഒരു പ്രിന്റർ ഉണ്ടോ?
                  </h3>
                  <p className="font-malayalam text-xs text-emerald-200 leading-relaxed">
                    നിങ്ങളുടെ വാർഡിലെയും പഞ്ചായത്തിലെയും ആളുകൾ തയ്യാറാക്കുന്ന അപേക്ഷകളും ബയോഡാറ്റകളും നിങ്ങളുടെ വീട്ടിലെ പ്രിന്ററിൽ പ്രിന്റ് എടുത്ത് ഒരുമിച്ച് ഡെലിവറി ചെയ്ത് വരുമാനം നേടാം!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegisterPartnerForm((prev) => !prev)}
                  className="shrink-0 min-h-[42px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-malayalam font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {showRegisterPartnerForm ? 'ഫോം അടയ്ക്കുക' : '+ ഹോം പ്രിന്റർ രജിസ്റ്റർ ചെയ്യാം'}
                  </span>
                </button>
              </div>

              {/* Partner Registration Form */}
              {showRegisterPartnerForm && (
                <form
                  onSubmit={handleRegisterNewPartner}
                  className="bg-emerald-50/70 border-2 border-emerald-500/40 rounded-2xl p-4 space-y-3"
                >
                  <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-emerald-950">
                    🖨️ പുതിയ ഹോം പ്രിന്റർ യൂണിറ്റ് രജിസ്ട്രേഷൻ
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                        വീട്ടിലെ പ്രിന്റർ യൂണിറ്റിന്റെ പേര് *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="ഉദാ: കൈരളി ഹോം പ്രിന്റ് സർവീസ്, മട്ടന്നൂർ"
                        className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                        നടത്തുന്ന ആളുടെ പേര് *
                      </label>
                      <input
                        type="text"
                        value={newOperatorName}
                        onChange={(e) => setNewOperatorName(e.target.value)}
                        placeholder="ഉദാ: ഫാത്തിമ / രാഹുൽ"
                        className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                        ഫോൺ / WhatsApp നമ്പർ *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newPartnerPhone}
                        onChange={(e) => setNewPartnerPhone(e.target.value)}
                        placeholder="ഉദാ: 9847000000"
                        className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-300 font-mono-num text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                        പഞ്ചായത്ത് / ടൗൺ / വാർഡ് *
                      </label>
                      <input
                        type="text"
                        value={newPanchayat}
                        onChange={(e) => setNewPanchayat(e.target.value)}
                        placeholder="ഉദാ: കൊളാരി, വാർഡ് 5"
                        className="w-full min-h-[40px] px-3 rounded-xl bg-white border border-slate-300 font-malayalam text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-malayalam text-xs font-bold text-slate-800 mb-1">
                        പിൻകോഡ് & ഡെലിവറി ചാർജ് (₹)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPincode}
                          onChange={(e) => setNewPincode(e.target.value)}
                          placeholder="670702"
                          className="w-1/2 min-h-[40px] px-2.5 rounded-xl bg-white border border-slate-300 font-mono-num text-xs text-slate-900"
                        />
                        <input
                          type="number"
                          value={newDeliveryCharge}
                          onChange={(e) => setNewDeliveryCharge(Number(e.target.value) || 10)}
                          placeholder="₹10"
                          className="w-1/2 min-h-[40px] px-2.5 rounded-xl bg-white border border-slate-300 font-mono-num text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-malayalam font-bold text-slate-800">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newHasColorPrinter}
                        onChange={(e) => setNewHasColorPrinter(e.target.checked)}
                      />
                      <span>കളർ പ്രിന്റർ ലഭ്യമാണ് (Color CV)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newHasHomeDelivery}
                        onChange={(e) => setNewHasHomeDelivery(e.target.checked)}
                      />
                      <span>വീട്ടിൽ ഡെലിവറി ചെയ്തു കൊടുക്കും</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-extrabold text-xs cursor-pointer"
                  >
                    ✓ ഹോം പ്രിന്റർ യൂണിറ്റ് ഓൺലൈനായി ചേർക്കുക
                  </button>
                </form>
              )}

              {/* Live Incoming Batch Print Orders Queue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-emerald-700" />
                    <span>ലഭിച്ച ഒരുമിച്ചുള്ള പ്രിന്റ് & ഡെലിവറി ഓർഡറുകൾ ({orders.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={fetchPrintNetworkData}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-malayalam font-bold text-[11px] cursor-pointer"
                  >
                    🔄 പുതുക്കുക
                  </button>
                </div>

                {isLoadingNetwork ? (
                  <div className="py-8 text-center text-xs font-malayalam text-slate-500">
                    ഓർഡറുകൾ ലോഡ് ചെയ്യുന്നു...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <p className="font-malayalam font-bold text-xs text-slate-700">
                      ഇതുവരെ ഹോം ഡെലിവറി പ്രിന്റ് ഓർഡറുകൾ വന്നിട്ടില്ല.
                    </p>
                    <p className="font-malayalam text-[11px] text-slate-500">
                      ഉപഭോക്താക്കൾ കാർട്ടിൽ 1 മുതൽ 10+ ഫയലുകൾ ചേർത്ത് "ഹോം പ്രിന്റ് ഡെലിവറി" ബുക്ക് ചെയ്യുമ്പോൾ എല്ലാ ഫയലുകളും ഇവിടെ ഒരുമിച്ച് കാണാം.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((ord) => (
                      <div
                        key={ord.orderId}
                        className="bg-white border-2 border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-400 font-mono-num font-black text-xs">
                                #{ord.orderId}
                              </span>
                              <span className="font-malayalam font-extrabold text-xs sm:text-sm text-slate-900">
                                {ord.customerName} ({ord.customerPhone})
                              </span>
                            </div>
                            <p className="font-malayalam text-[11px] text-slate-600 mt-0.5">
                              📍 {ord.customerAddress || 'Self Pickup'} · 🖨️ {ord.selectedPartnerName} · 🕒 {ord.createdAt}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-mono-num font-black text-xs">
                              ₹{ord.finalPayableAmount} ({ord.paymentStatus === 'PAID' ? 'PAID' : 'COD'})
                            </span>
                            <select
                              aria-label="ഓർഡർ സ്റ്റാറ്റസ്"
                              value={ord.orderStatus}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  ord.orderId,
                                  e.target.value as OnlinePrintDeliveryOrder['orderStatus']
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-malayalam font-bold text-[11px] cursor-pointer"
                            >
                              <option value="NEW_ORDER">🆕 പുതിയ ഓർഡർ</option>
                              <option value="PRINTING">🖨️ പ്രിന്റ് ചെയ്യുന്നു</option>
                              <option value="OUT_FOR_DELIVERY">🛵 ഡെലിവറിക്ക് പുറപ്പെട്ടു</option>
                              <option value="COMPLETED">✅ പൂർത്തിയായി</option>
                            </select>
                          </div>
                        </div>

                        {/* All Attached Documents in this Batch Order */}
                        <div className="space-y-1.5">
                          <p className="font-malayalam text-[11px] font-extrabold text-slate-700">
                            ഒരുമിച്ച് പ്രിന്റ് ചെയ്യേണ്ട ഫയലുകൾ ({ord.items?.length || 0} എണ്ണം):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(ord.items || []).map((fileItem, fIdx) => (
                              <div
                                key={fileItem.id || fIdx}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-malayalam font-extrabold text-xs text-slate-900 truncate">
                                    {fIdx + 1}. {fileItem.title}
                                  </p>
                                  <p className="font-malayalam text-[10px] text-slate-600">
                                    {fileItem.copies || 1} കോപ്പി · {PAPER_TYPE_LABELS[fileItem.paperType] || 'A4'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    onLoadCartItemToEditor(fileItem, true);
                                    onClose();
                                  }}
                                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-malayalam font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>തുറന്ന് പ്രിന്റ് ചെയ്യുക</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
