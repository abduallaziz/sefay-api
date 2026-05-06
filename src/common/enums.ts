export enum BusinessType {
  CAR_WASH = 'CAR_WASH',
  CAFE     = 'CAFE',
  TAILOR   = 'TAILOR',
  MARKET   = 'MARKET',
}

export enum ItemType {
  PRODUCT = 'PRODUCT',  // شيء يُباع
  SERVICE = 'SERVICE',  // شيء يُنفَّذ
  CUSTOM  = 'CUSTOM',   // مرن
}

export enum OperationType {
  SELL   = 'SELL',    // بيع مباشر POS
  BOOK   = 'BOOK',    // حجز موعد
  REPAIR = 'REPAIR',  // استلام وتسليم
  RENT   = 'RENT',    // إيجار بفترة
}

export enum Capability {
  INVENTORY     = 'INVENTORY',     // مخزون
  APPOINTMENTS  = 'APPOINTMENTS',  // مواعيد
  VARIANTS      = 'VARIANTS',      // أحجام/ألوان
  SUBSCRIPTIONS = 'SUBSCRIPTIONS', // اشتراكات
}