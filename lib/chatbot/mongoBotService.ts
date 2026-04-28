import BotUser from '../models/BotUser';
import ChatMessage from '../models/ChatMessage';
import Property from '../models/Property';
import { WhatsappService } from './whatsappService';
import connectDB from '../db';

const whatsapp = new WhatsappService();

/* -------------------- CACHE -------------------- */
let cachedCities: string[] = [];
let lastCityFetch = 0;

async function getCities() {
  const now = Date.now();

  if (cachedCities.length && now - lastCityFetch < 3600000) {
    return cachedCities;
  }

  const cities = await Property.distinct('city');
  cachedCities = cities.map((c: string) => c.toLowerCase());
  lastCityFetch = now;

  return cachedCities;
}

/* -------------------- INTENT -------------------- */
function detectIntent(text: string) {
  const t = text.toLowerCase().trim();

  if (['hi', 'hello', 'hey', 'hii', 'hlo'].includes(t)) return 'greeting';
  if (t.includes('who are you') || t.includes('what are you')) return 'identity';
  if (t === 'yes') return 'yes';
  if (t === 'no') return 'no';
  if (t.includes("don't want") || t.includes('not interested')) return 'negative';

  if (
    t.includes('flat') ||
    t.includes('apartment') ||
    t.includes('plot') ||
    t.includes('villa') ||
    t.includes('rent') ||
    t.includes('buy')
  ) return 'search';

  return 'fallback';
}

/* -------------------- ENTITY EXTRACTION -------------------- */
async function extractEntities(text: string) {
  const lower = text.toLowerCase();

  const cities = await getCities();
  let location = cities.find(c => lower.includes(c)) || '';

  const categories = ['flat', 'apartment', 'villa', 'plot', 'shop', 'office'];
  const category = categories.find(c => lower.includes(c)) || '';

  const areaMatch = lower.match(/(\d{3,5})\s?sqft/);
  const area = areaMatch ? parseInt(areaMatch[1]) : null;

  return { location, category, area };
}

/* -------------------- QUERY BUILDER -------------------- */
function buildQuery(ctx: any) {
  const query: any = {
    status: 1,
    availability: true
  };

  if (ctx.location) {
    query.$or = [
      { city: { $regex: ctx.location, $options: 'i' } },
      { locality: { $regex: ctx.location, $options: 'i' } }
    ];
  }

  if (ctx.category) {
    query.category = { $regex: ctx.category, $options: 'i' };
  }

  if (ctx.area) {
    query.area = {
      $gte: ctx.area - 200,
      $lte: ctx.area + 200
    };
  }

  return query;
}

/* -------------------- MAIN FUNCTION -------------------- */
export async function processWhatsAppMessage(
  mobile: string,
  text: string,
  messageId?: string,
  contextId?: string
) {
  
  console.log(`[Chatbot] ${mobile}: ${text}`);

  try {
    await connectDB();

    let user: any = await BotUser.findOne({ mobile });

    /* ---------- NEW USER ---------- */
    if (!user) {
      user = await BotUser.create({ mobile, status: 'name_pending' });

      await whatsapp.sendMessage(
        mobile,
        `Hi, welcome to DesiProperty 😊\n\nBefore we begin, may I know your name?`
      );
      return;
    }

    /* ---------- NAME ---------- */
    if (user.status === 'name_pending') {
      const name = text.trim();
      if (name.length < 2) return;

      await BotUser.updateOne(
        { _id: user._id },
        { name, status: 'active' }
      );

      await whatsapp.sendMessage(
        mobile,
        `Nice to meet you, ${name} 😊\n\nWhat kind of property are you looking for?`
      );
      return;
    }

    const lowerText = text.toLowerCase().trim();
    const intent = detectIntent(lowerText);

    let ctx = user.lastSearch || {};

    /* ---------- INTENT HANDLING ---------- */

    if (intent === 'greeting') {
      await whatsapp.sendMessage(
        mobile,
        `Hi ${user.name}, what kind of property are you looking for?`
      );
      return;
    }

    if (intent === 'identity') {
      await whatsapp.sendMessage(
        mobile,
        `I'm your property consultant. I help you find the right property based on your needs.`
      );
      return;
    }

    if (intent === 'negative') {
      await whatsapp.sendMessage(
        mobile,
        `No problem 😊 If you need anything later, just let me know.`
      );
      return;
    }

    if (intent === 'no') {
      await whatsapp.sendMessage(
        mobile,
        `No worries 👍 Let me know whenever you need help.`
      );
      return;
    }

    if (intent === 'yes') {
      if (ctx.location) {
        await whatsapp.sendMessage(
          mobile,
          `Great 👍 Showing nearby options for ${ctx.location}`
        );
        ctx.location = ''; // remove strict filter
      } else {
        await whatsapp.sendMessage(
          mobile,
          `Please tell me your preferred location 😊`
        );
        return;
      }
    }

    /* ---------- ENTITY EXTRACTION ---------- */
    const extracted = await extractEntities(text);

    ctx = {
      ...ctx,
      location: extracted.location || ctx.location,
      category: extracted.category || ctx.category,
      area: extracted.area || ctx.area
    };

    await BotUser.updateOne(
      { _id: user._id },
      { lastSearch: ctx }
    );

    /* ---------- SEARCH ---------- */
    if (intent === 'search' || ctx.location || ctx.category) {
      const query = buildQuery(ctx);
      const matches = await Property.find(query).limit(3).lean();

      if (!matches.length) {
        if (ctx.location) {
          await whatsapp.sendMessage(
            mobile,
            `I couldn’t find properties in ${ctx.location} 😕\n\nWould you like nearby areas or another city?`
          );
        } else {
          await whatsapp.sendMessage(
            mobile,
            `I couldn’t find exact matches.\n\nTry sharing location or budget 😊`
          );
        }
        return;
      }

      const intro = ctx.location
        ? `Here are some options in ${ctx.location}:`
        : `Here are some properties you might like:`;

      await whatsapp.sendMessage(mobile, intro);

      for (const p of matches) {
        const msg = `🏢 ${p.title}
📍 ${p.locality}, ${p.city}
💰 ${p.price ? '₹' + p.price : 'Price on request'}
📐 ${p.area || 'N/A'} sqft

🔗 https://admin.desiproperty.cloud/p/${p._id}?uid=${user._id}`;

        await whatsapp.sendMessage(mobile, msg);
      }

      await whatsapp.sendMessage(
        mobile,
        `Want me to refine based on budget or property type?`
      );
    } else {
      /* ---------- FALLBACK ---------- */
      await whatsapp.sendMessage(
        mobile,
        `I can help you find properties.\n\nJust tell me location, budget, or type 😊`
      );
    }

    /* ---------- SAVE CHAT ---------- */
    await ChatMessage.create({
      userId: user._id,
      mobile,
      message: text,
      response: "Processed",
      timestamp: new Date()
    });

  } catch (error) {
    console.error(error);

    await whatsapp.sendMessage(
      mobile,
      "Something went wrong. Please try again."
    );
  }
}