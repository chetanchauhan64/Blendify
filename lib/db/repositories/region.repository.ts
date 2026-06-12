// ============================================================
// BLENDIFY — Country & Currency Repository
// ============================================================
import { Country, Currency, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

// ── Country Repository ──────────────────────────────────────

export class CountryRepository extends BaseRepository {
  async findAll(activeOnly = true): Promise<Country[]> {
    return this.db.country.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { currency: true },
      orderBy: { name: 'asc' },
    }) as unknown as Country[];
  }

  async findByCode(code: string) {
    return this.db.country.findUnique({
      where: { code },
      include: {
        currency: true,
        taxRules: { where: { isActive: true } },
        shippingRates: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findById(id: string) {
    return this.db.country.findUnique({
      where: { id },
      include: { currency: true, taxRules: true, shippingRates: true },
    });
  }

  async create(data: Prisma.CountryCreateInput) {
    return this.db.country.create({ data, include: { currency: true } });
  }

  async update(id: string, data: Prisma.CountryUpdateInput) {
    return this.db.country.update({
      where: { id },
      data,
      include: { currency: true },
    });
  }
}

// ── Currency Repository ─────────────────────────────────────

export class CurrencyRepository extends BaseRepository {
  async findAll(activeOnly = true): Promise<Currency[]> {
    return this.db.currency.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string): Promise<Currency | null> {
    return this.db.currency.findUnique({ where: { code } });
  }

  async updateExchangeRates(rates: Record<string, number>) {
    const updates = Object.entries(rates).map(([code, rate]) =>
      this.db.currency.updateMany({
        where: { code },
        data: { exchangeRate: rate, updatedAt: new Date() },
      }),
    );
    return Promise.all(updates);
  }

  async create(data: Prisma.CurrencyCreateInput): Promise<Currency> {
    return this.db.currency.create({ data });
  }

  async upsert(data: {
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
  }): Promise<Currency> {
    return this.db.currency.upsert({
      where: { code: data.code },
      update: { exchangeRate: data.exchangeRate, updatedAt: new Date() },
      create: data,
    });
  }
}

export const countryRepository = new CountryRepository();
export const currencyRepository = new CurrencyRepository();
