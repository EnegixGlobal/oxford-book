/**
 * Shiprocket API Integration Service
 * Documentation: https://apidocs.shiprocket.in/
 */

const SHIPROCKET_BASE_URL = process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external';
// Trim whitespace to handle common .env file issues
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL?.trim();
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD?.trim();

interface ShiprocketTokenResponse {
  token: string;
}

interface ShiprocketAddress {
  name: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}

interface CreateShipmentRequest {
  order_id: string; // Your order ID
  order_date: string; // ISO date string
  pickup_location: string; // Pickup location name (configured in Shiprocket)
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pincode: string;
  billing_phone: string;
  billing_email?: string;
  shipping_is_billing: boolean;
  shipping_customer_name: string;
  shipping_last_name?: string;
  shipping_address: string;
  shipping_address_2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_pincode: string;
  shipping_phone: string;
  shipping_email?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

interface ShiprocketShipmentResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarded_flag: number;
  awb_code: string | null;
  courier_company_id: number | null;
  courier_name: string | null;
}

interface ShiprocketTrackingResponse {
  tracking_data: {
    shipment_track: Array<{
      id: number;
      awb_code: string;
      courier_id: number;
      shipment_status: number;
      shipment_status_label: string;
      shipment_track_activities: Array<{
        date: string;
        status: string;
        activity: string;
        location: string;
        sr_status: string;
        sr_status_label: string;
      }>;
    }>;
  };
}

interface ShiprocketRateRequest {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  cod_amount?: number;
}

interface ShiprocketRateResponse {
  data: {
    available_courier_companies: Array<{
      courier_company_id: number;
      courier_name: string;
      rate: number;
      estimated_delivery_days: string;
    }>;
  };
}

class ShiprocketService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Get authentication token from Shiprocket
   * Public method for use in routes that need direct token access
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid (tokens typically expire in 24 hours)
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
      throw new Error('Shiprocket credentials not configured. Please check SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD environment variables.');
    }

    // Validate email format
    if (!SHIPROCKET_EMAIL.includes('@')) {
      throw new Error('Invalid Shiprocket email format');
    }

    try {
      const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: SHIPROCKET_EMAIL,
          password: SHIPROCKET_PASSWORD,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Shiprocket auth failed (${response.status}): ${errorText}`;
        
        // Provide helpful error messages
        if (response.status === 403) {
          errorMessage += '\n\nTip: If your password contains special characters (#, @, !, $, etc.), make sure it is wrapped in quotes in your .env file:\nSHIPROCKET_PASSWORD="your_password_here"';
        }
        
        throw new Error(errorMessage);
      }

      const data: ShiprocketTokenResponse = await response.json();
      this.token = data.token;
      // Set expiry to 23 hours from now (tokens typically last 24 hours)
      this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      return this.token;
    } catch (error) {
      console.error('Shiprocket authentication error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getToken();
    const url = `${SHIPROCKET_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[SHIPROCKET] API request failed: ${response.status} ${response.statusText}`, {
        url,
        endpoint,
        error
      });
      throw new Error(`Shiprocket API error: ${error}`);
    }

    return response.json();
  }

  /**
   * Get pickup locations from Shiprocket
   */
  async getPickupLocations(): Promise<any[]> {
    try {
      const response = await this.makeRequest<any>('/settings/company/pickup');
      // Pickup locations are in data.data.shipping_address array
      return response?.data?.shipping_address || [];
    } catch (error) {
      console.error('[SHIPROCKET] Get pickup locations error:', error);
      throw error;
    }
  }

  /**
   * Get the primary pickup location name
   */
  async getPrimaryPickupLocation(): Promise<string | null> {
    try {
      const locations = await this.getPickupLocations();
      const primary = locations.find((loc: any) => loc.is_primary_location === 1);
      return primary?.pickup_location || locations[0]?.pickup_location || null;
    } catch (error) {
      console.error('[SHIPROCKET] Get primary pickup location error:', error);
      return null;
    }
  }

  /**
   * Create a shipment in Shiprocket
   */
  async createShipment(data: CreateShipmentRequest): Promise<ShiprocketShipmentResponse> {
    try {
      console.log('[SHIPROCKET] Creating shipment with data:', JSON.stringify(data, null, 2));
      const response = await this.makeRequest<ShiprocketShipmentResponse>(
        '/orders/create/adhoc',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      console.log('[SHIPROCKET] Shipment created successfully:', response);
      return response;
    } catch (error) {
      console.error('[SHIPROCKET] Create shipment error:', error);
      throw error;
    }
  }

  /**
   * Track shipment by AWB code
   */
  async trackShipment(awbCode: string): Promise<ShiprocketTrackingResponse> {
    try {
      const response = await this.makeRequest<ShiprocketTrackingResponse>(
        `/courier/track/awb/${awbCode}`
      );
      return response;
    } catch (error) {
      console.error('Shiprocket track shipment error:', error);
      throw error;
    }
  }

  /**
   * Track shipment by order ID
   */
  async trackByOrderId(orderId: string): Promise<ShiprocketTrackingResponse> {
    try {
      const response = await this.makeRequest<ShiprocketTrackingResponse>(
        `/courier/track/shipment/${orderId}`
      );
      return response;
    } catch (error) {
      console.error('Shiprocket track by order ID error:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates
   */
  async getRates(data: ShiprocketRateRequest): Promise<ShiprocketRateResponse> {
    try {
      const response = await this.makeRequest<ShiprocketRateResponse>(
        '/courier/serviceability/',
        {
          method: 'GET',
        }
      );
      // Note: Shiprocket rates API might require query params instead
      // This is a simplified version - adjust based on actual API docs
      const url = new URL(`${SHIPROCKET_BASE_URL}/courier/serviceability/`);
      url.searchParams.append('pickup_pincode', data.pickup_pincode);
      url.searchParams.append('delivery_pincode', data.delivery_pincode);
      url.searchParams.append('weight', data.weight.toString());
      if (data.cod_amount) {
        url.searchParams.append('cod_amount', data.cod_amount.toString());
      }

      const token = await this.getToken();
      const rateResponse = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!rateResponse.ok) {
        const error = await rateResponse.text();
        throw new Error(`Shiprocket rates API error: ${error}`);
      }

      return rateResponse.json();
    } catch (error) {
      console.error('Shiprocket get rates error:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(awbCode: string): Promise<{ message: string }> {
    try {
      const response = await this.makeRequest<{ message: string }>(
        `/orders/cancel/shipment/awb/${awbCode}`,
        {
          method: 'POST',
        }
      );
      return response;
    } catch (error) {
      console.error('Shiprocket cancel shipment error:', error);
      throw error;
    }
  }

  /**
   * Generate AWB for shipment
   */
  async generateAWB(shipmentId: number): Promise<{ message: string }> {
    try {
      const response = await this.makeRequest<{ message: string }>(
        `/orders/print/awb`,
        {
          method: 'POST',
          body: JSON.stringify({
            shipment_id: [shipmentId],
          }),
        }
      );
      return response;
    } catch (error) {
      console.error('Shiprocket generate AWB error:', error);
      throw error;
    }
  }

  /**
   * Get shipment details by shipment ID
   */
  async getShipment(shipmentId: number): Promise<any> {
    try {
      const response = await this.makeRequest<any>(
        `/shipments/${shipmentId}`
      );
      return response;
    } catch (error) {
      console.error('Shiprocket get shipment error:', error);
      throw error;
    }
  }
}

export const shiprocketService = new ShiprocketService();
export type {
  CreateShipmentRequest,
  ShiprocketShipmentResponse,
  ShiprocketTrackingResponse,
  ShiprocketRateRequest,
  ShiprocketRateResponse,
  ShiprocketAddress,
  ShiprocketOrderItem,
};

