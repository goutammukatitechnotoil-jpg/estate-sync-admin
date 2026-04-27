const { aisensyApiUrl, aisensyApiKey } = require('./config');

/**
 * Service to handle outgoing WhatsApp messages via AiSensy
 */
class WhatsappService {
  /**
   * Send a text message to a WhatsApp user
   * @param {string} to - Recipient phone number (with country code)
   * @param {string} body - The message content
   */
  async sendMessage(to, body) {
    if (!body) return;
    
    const payload = {
      apiKey: aisensyApiKey,
      to: to,
      type: 'text',
      recipient_type: 'individual',
      text: { body: body }
    };

    try {
      console.log(`AiSensy: Sending text to ${to}...`);
      const response = await fetch(aisensyApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-AiSensy-Project-API-Pwd': aisensyApiKey
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('AiSensy Send Error (Text):', error.message);
      throw error;
    }
  }

  /**
   * Send an image with caption to a WhatsApp user
   * @param {string} to - Recipient phone number
   * @param {string} imageUrl - URL of the image
   * @param {string} caption - Optional caption
   */
  async sendPhoto(to, imageUrl, caption) {
    const payload = {
      to: to,
      type: 'image',
      recipient_type: 'individual',
      image: {
        link: imageUrl,
        caption: caption || ''
      }
    };

    try {
      console.log(`AiSensy: Sending image to ${to}...`);
      const response = await fetch(aisensyApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aisensyApiKey}`,
          'X-AiSensy-API-Key': aisensyApiKey,
          'X-AiSensy-Project-API-Pwd': aisensyApiKey
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('AiSensy Send Error (Image):', error.message);
      // Fallback to text if image fails
      return this.sendMessage(to, `${caption}\n\nPhoto: ${imageUrl}`);
    }
  }

  /**
   * Send an interactive message with image, body text, and buttons
   * Used for Property Cards
   * @param {string} to - Recipient phone number
   * @param {string} imageUrl - URL of the image
   * @param {string} bodyText - Main text content
   * @param {Array} buttons - List of buttons [{ id: string, title: string }]
   */
  async sendInteractiveButtons(to, imageUrl, bodyText, buttons) {
    const payload = {
      to: to,
      type: 'interactive',
      recipient_type: 'individual',
      interactive: {
        type: 'button',
        header: {
          type: 'image',
          image: { link: imageUrl }
        },
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    try {
      console.log(`AiSensy: Sending interactive message to ${to}...`);
      const response = await fetch(aisensyApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aisensyApiKey}`,
          'X-AiSensy-API-Key': aisensyApiKey,
          'X-AiSensy-Project-API-Pwd': aisensyApiKey
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('AiSensy Send Error (Interactive):', error.message);
      await this.sendPhoto(to, imageUrl, bodyText);
      return this.sendMessage(to, `Options: ${buttons.map(b => b.title).join(', ')}`);
    }
  }

  /**
   * Send an official AiSensy template message
   * @param {string} to - Recipient phone number
   * @param {string} templateName - Name of the template in AiSensy
   * @param {Array} params - Optional parameters for the template components
   * @param {string} headerImageUrl - Optional URL for an image header
   */
  async sendTemplate(to, templateName, params = [], headerImageUrl = null) {
    const components = [];

    // Add Header if image is provided (Required for templates with image headers)
    if (headerImageUrl && typeof headerImageUrl === 'string' && headerImageUrl.startsWith('http')) {
      components.push({
        type: 'header',
        parameters: [{
          type: 'image',
          image: { 
            link: headerImageUrl 
          }
        }]
      });
    }

    // Add Body parameters
    if (params.length > 0) {
      components.push({
        type: 'body',
        parameters: params.map(p => ({
          type: 'text',
          text: String(p)
        }))
      });
    }

    const payload = {
      to: to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en'
        },
        components: components
      }
    };

    try {
      console.log(`AiSensy: Sending template "${templateName}" to ${to}...`);
      const response = await fetch(aisensyApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-AiSensy-Project-API-Pwd': aisensyApiKey
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(`[AiSensy Error] Message:`, error.message);
      throw error;
    }
  }
}

module.exports = { WhatsappService };
