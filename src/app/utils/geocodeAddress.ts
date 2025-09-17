import axios from 'axios';

const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: address,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'YourAppName/1.0 (raseldev847@gmai.com)', // required by Nominatim
      },
    });

    const data = response.data;

    if (data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    return [lon, lat]; // MongoDB expects [longitude, latitude]
  } catch (error) {
    console.error('Geocoding failed:', (error as any).message);
    return null;
  }
};

export default geocodeAddress;
