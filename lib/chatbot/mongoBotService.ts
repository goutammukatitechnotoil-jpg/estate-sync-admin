import mongoose from 'mongoose';
import BotUser from '../models/BotUser';
import ChatMessage from '../models/ChatMessage';
import Property from '../models/Property';
import SentMessage from '../models/SentMessage';
import { WhatsappService } from './whatsappService';
import { OllamaClient } from './ollamaClient';
import { openclawBaseUrl, companyName } from './config';
import connectDB from '../db';
import console from 'console';

const whatsapp = new WhatsappService();
const ollama = new OllamaClient(openclawBaseUrl || 'http://localhost:11434');

export async function processWhatsAppMessage(mobile: string, text: string, messageId?: string, contextId?: string) {
  console.log(`[Chatbot] Processing message from ${mobile}: "${text}" (Context: ${contextId})`);

  try {
    const db = await connectDB();
    let user = await BotUser.findOne({ mobile });

    if (!user) {
      user = await BotUser.create({ mobile, status: 'name_pending' });
      const response = `[Sent Template: welcome_message_new_user]`;
      await whatsapp.sendTemplate(mobile, 'welcome_message_new_user', [companyName]);

      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: response,
        timestamp: new Date()
      });
      return;
    }

    // Session Reset Logic
    const now = new Date();
    const lastInteraction = user.updatedAt || new Date(0);
    const isNewSession = lastInteraction.toDateString() !== now.toDateString() || (user as any).isIntervened;
    await BotUser.updateOne({ _id: user._id }, { updatedAt: now, isIntervened: false });

    // Name Collection
    if (user.status === 'name_pending') {
      const collectedName = text.trim();
      if (collectedName.length < 2) return;
      await BotUser.updateOne({ _id: user._id }, { name: collectedName, status: 'active' });
      const response = `Thanks ${collectedName}! I've saved your name. How can I help you with your property search today?`;
      await whatsapp.sendTemplate(mobile, 'new_user_2nd_message', [collectedName]);

      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: response,
        timestamp: new Date()
      });
      return;
    }

    const lowerText = text.toLowerCase().trim();

    // 1. ESCAPE / AGENT REQUEST
    if (lowerText === "talk to agent" || lowerText === "call agent") {
      const response = "I'm connecting you with our senior property consultant. They will reach out to you on this number shortly. 📞\n\nBest regards,\nTeam " + companyName;
      await whatsapp.sendMessage(mobile, "I'm connecting you with our senior property consultant. They will reach out to you on this number shortly. 📞");
      await whatsapp.sendMessage(mobile, `Best regards,\nTeam ${companyName}`);

      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: response,
        timestamp: new Date()
      });
      return;
    }

    // 2. INTENT DETECTION (GREETING & IDENTITY)
    const greetings = ['hello', 'hi', 'hy', 'hey', 'namaste', 'hlo', 'greet', 'good morning', 'good evening', 'hii'];
    const identityQueries = ['who are you', 'your name', 'who is this', 'what are you', 'what do you do', 'company name'];

    const isGreeting = greetings.some(g => lowerText.startsWith(g)) && lowerText.split(' ').length <= 2;
    const isIdentity = identityQueries.some(iq => lowerText.includes(iq));

    if (isGreeting) {
      const response = `Hi ${user.name}! Welcome to ${companyName}. How can I help you find your dream property today?\n\nBest regards,\nTeam ${companyName}`;
      await whatsapp.sendMessage(mobile, `Hi ${user.name}! Welcome to ${companyName}. How can I help you find your dream property today?`);
      await whatsapp.sendMessage(mobile, `Best regards,\nTeam ${companyName}`);

      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: response,
        timestamp: new Date()
      });
      return;
    }

    if (isIdentity) {
      const response = `I am your dedicated Property Consultant here at ${companyName}. I can help you find premium residential and commercial properties in the region.\n\nBest regards,\nTeam ${companyName}`;
      await whatsapp.sendMessage(mobile, `I am your dedicated Property Consultant here at ${companyName}. I can help you find premium residential and commercial properties in the region.`);
      await whatsapp.sendMessage(mobile, `Best regards,\nTeam ${companyName}`);

      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: response,
        timestamp: new Date()
      });
      return;
    }

    // 3. SEARCH LOGIC (Refined to prevent false positives)
    const categories = ['plot', 'villa', 'house', 'shop', 'office', 'flat', 'apartment', 'commercial', 'residential', 'industrial', 'bhk', 'sqft'];
    const stopwords = ['any', 'available', 'show', 'me', 'some', 'the', 'want', 'looking', 'for', 'have', 'you', 'can', 'find', 'details', 'of', 'property', 'share', 'give', 'tell', 'about', 'is', 'there', 'again', 'images', 'its', 'who', 'are', 'what', 'where', 'how', 'help'];

    const detectedCategory = categories.find(cat => lowerText.includes(cat));
    const keywords = text.split(' ').filter(k => {
      const cleanK = k.toLowerCase().replace(/[?!.,]/g, '');
      return cleanK.length > 2 && !categories.includes(cleanK) && !greetings.includes(cleanK) && !stopwords.includes(cleanK);
    });

    const isSearch = !!(detectedCategory || keywords.length > 0);

    if (!isSearch) {
      // Fallback to AI for non-search conversation
      const chatPrompt = `You are a professional Real Estate Consultant for ${companyName}. User is asking: "${text}". Give a short, helpful response (max 30 words). No placeholders.`;
      const aiResponse = await ollama.getChatResponse({
        model: 'qwen2.5:3b',
        messages: [{ role: 'system', content: "Short professional real estate assistant." }, { role: 'user', content: chatPrompt }],
        stream: false
      });
      const responseText = aiResponse.message.content.trim();
      await whatsapp.sendMessage(mobile, responseText);
      await whatsapp.sendMessage(mobile, `Best regards,\nTeam ${companyName}`);

      // Save to History
      await ChatMessage.create({
        userId: user._id,
        mobile,
        message: text,
        response: responseText,
        timestamp: new Date()
      });
      return;
    }

    // 4. PERFORM DATABASE SEARCH
    const query: any = { status: 1, availability: true };
    if (detectedCategory) query.category = { $regex: detectedCategory, $options: 'i' };
    if (keywords.length > 0) {
      query.$or = keywords.map(k => ({
        $or: [
          { title: { $regex: k, $options: 'i' } },
          { city: { $regex: k, $options: 'i' } },
          { locality: { $regex: k, $options: 'i' } },
          { highlights: { $regex: k, $options: 'i' } }
        ]
      }));
    }

    let matches = await Property.find(query).limit(3).lean();
    if (matches.length === 0 && detectedCategory) {
      matches = await Property.find({ status: 1, availability: true, category: { $regex: detectedCategory, $options: 'i' } }).limit(3).lean();
    }

    const formatPrice = (p: any) => {
      if (p.price) {
        return `₹${(p.price / 10000000).toFixed(2)} Cr`;
      }
      if (p.minPrice) {
        const min = p.priceType === 'Cr' ? p.minPrice : (p.minPrice / 100);
        const max = p.priceType === 'Cr' ? p.maxPrice : (p.maxPrice / 100);
        return `₹${min.toFixed(2)}-${max.toFixed(2)} Cr`;
      }
      return 'Price on Request';
    };

    // 5. INTRO & PROPERTY DELIVERY
    const introPrompt = `User wants ${detectedCategory || 'properties'}. Write a 1-sentence professional intro. No closings. Max 15 words.`;
    const aiIntro = await ollama.getChatResponse({
      model: 'qwen2.5:3b',
      messages: [{ role: 'system', content: "Professional real estate intro only." }, { role: 'user', content: introPrompt }],
      stream: false
    });

    const introText = aiIntro.message.content.trim();
    await whatsapp.sendMessage(mobile, introText);

    let propertyResponses = [];
    if (matches.length > 0) {
      for (const p of matches) {
        const block = `🏢 *${p.title}*\n📍 ${p.locality}, ${p.city}\n💰 *${formatPrice(p)}*\n📐 ${p.area ? p.area + ' sqft' : 'N/A'} | ${p.category}\n\n🔗 View Full Details:\nhttps://admin.desiproperty.cloud/p/${p._id}?v=${Date.now()}&uid=${user._id}`;
        propertyResponses.push(block);

        await whatsapp.sendMessage(mobile, block);

        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } else {
      const fallbackMsg = "I couldn't find an exact match right now. Our team will contact you with more exclusive options shortly.";
      propertyResponses.push(fallbackMsg);
      await whatsapp.sendMessage(mobile, fallbackMsg);
    }

    const finalMsg = `Best regards,\nTeam ${companyName}`;
    await whatsapp.sendMessage(mobile, finalMsg);

    // Save Search Result to History
    await ChatMessage.create({
      userId: user._id,
      mobile,
      message: text,
      response: [introText, ...propertyResponses, finalMsg].join('\n\n'),
      timestamp: new Date()
    });

  } catch (error) {
    console.error('[Chatbot] Global Error:', error);
    const errorMsg = "I'm experiencing a temporary delay. Our agent will assist you manually in a moment.";
    await whatsapp.sendMessage(mobile, errorMsg);

    // Log the failure so the admin sees what happened
    try {
      const db = await connectDB();
      const user = await BotUser.findOne({ mobile });
      if (user) {
        await ChatMessage.create({
          userId: user._id,
          mobile,
          message: text,
          response: `[Bot Error] ${errorMsg}`,
          timestamp: new Date()
        });
      }
    } catch (logError) {
      console.error('Failed to log chatbot error:', logError);
    }
  }
}
