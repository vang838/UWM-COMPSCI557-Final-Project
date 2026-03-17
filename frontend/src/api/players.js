// api fetch helper script
import axios from 'axios';

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/players/`;

export const fetchPlayers = async() => {
    try
    {
        const response = await axios.get(BASE_URL);
        return response.data
    }

    catch (error)
    {
        console.error('Error fetching players:', error);
        return [];
    }

}