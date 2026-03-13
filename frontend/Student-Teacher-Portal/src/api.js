// Utility functions for API calls with improved error handling

const API_BASE_URL = 'http://ec2-13-53-187-159.eu-north-1.compute.amazonaws.com:8081';

/**
 * Makes a fetch request with better error handling
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise} - Promise that resolves to the response data
 */
export async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making request to: ${url}`);
    console.log('Request options:', options);
    
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, [...response.headers.entries()]);
    
    // Try to parse JSON, but handle cases where response is not JSON
    let data;
    const contentType = response.headers.get('content-type');
    console.log(`Content type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Parsed JSON response:', data);
    } else {
      data = await response.text();
      console.log('Text response:', data);
    }
    
    if (!response.ok) {
      const errorMessage = data?.detail || data || `HTTP ${response.status}: ${response.statusText}`;
      console.error('API request failed with message:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('API request successful, returning data:', data);
    return { data, response };
  } catch (error) {
    console.error('=== API REQUEST ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - unable to connect to server');
      throw new Error('Unable to connect to the server. Please make sure the backend is running.');
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Makes a GET request
 * @param {string} endpoint - API endpoint
 * @param {Object} headers - Additional headers
 * @returns {Promise} - Promise that resolves to the response data
 */
export async function apiGet(endpoint, headers = {}) {
  console.log(`Making GET request to ${endpoint}`);
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  const { data } = await apiRequest(endpoint, options);
  return data;
}

/**
 * Makes a POST request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} headers - Additional headers
 * @returns {Promise} - Promise that resolves to the response data
 */
export async function apiPost(endpoint, body, headers = {}) {
  console.log(`Making POST request to ${endpoint}`);
  console.log('Request body:', body);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  };
  
  console.log('Request options:', options);
  const { data } = await apiRequest(endpoint, options);
  console.log('POST request response data:', data);
  return data;
}

/**
 * Makes a PUT request
 * @param {string} endpoint - API endpoint
 * @param {Object} body - Request body
 * @param {Object} headers - Additional headers
 * @returns {Promise} - Promise that resolves to the response data
 */
export async function apiPut(endpoint, body, headers = {}) {
  console.log(`Making PUT request to ${endpoint}`);
  console.log('Request body:', body);
  
  const options = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  };
  
  const { data } = await apiRequest(endpoint, options);
  return data;
}

/**
 * Makes a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {Object} headers - Additional headers
 * @returns {Promise} - Promise that resolves to the response data
 */
export async function apiDelete(endpoint, headers = {}) {
  console.log(`Making DELETE request to ${endpoint}`);
  
  const options = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  const { data } = await apiRequest(endpoint, options);
  return data;
}

export default {
  API_BASE_URL,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiDelete
};