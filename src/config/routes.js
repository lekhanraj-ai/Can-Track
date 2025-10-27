export const busRoutes = {
  'Route 1': {
    busNumber: 'BUS001',
    stops: ['Beeri', 'Kolya', 'Kotekar', 'Talapady']
  },
  'Route 2': {
    busNumber: 'BUS002',
    stops: ['Bolwar', 'Bus Stand', 'Kabaka', 'Kalladka', 'Mani', 'Nagara', 'Puttur (Darbe Circle)']
  },
  'Route 3': {
    busNumber: 'BUS003',
    stops: ['Bikkarnakatte', 'Bondel', 'Kavoor', 'KPT', 'Mary Hill', 'Nanthoar Junction', 'Padavinangadi', 'Yeyyadi']
  },
  'Route 4': {
    busNumber: 'BUS004',
    stops: ['Chowki Canara Bank', 'Govindadas College', 'Honnavatte', 'Hosabettu', 'Kodical Cross', 'Kulal Pannambur', 
            'Kuloor', 'Marigudi (Surathkal)', 'NITK', 'Suraj Hotel', 'Thadambail']
  },
  'Route 5': {
    busNumber: 'BUS005',
    stops: ['Kankandy', 'Mangala Devi', 'Marnamikatte', 'Nandigudde', 'Pandeshwar', 'RTO', 'Velencia']
  },
  'Route 6': {
    busNumber: 'BUS006',
    stops: ['Adyarkatte', 'Ashok Nagar', 'Daivajna Hall', 'Durga Mahal', 'Mannagudda', 'Marigudi', 'Urwa Market']
  },
  'Route 7': {
    busNumber: 'BUS007',
    stops: ['Gorigudda', 'Jeppinamogaru', 'Kallapu', 'Kumpala', 'Pumpwell', 'Thokkottu', 'Ujjodi', 'Ullala', 'Yekkuru']
  },
  'Route 8': {
    busNumber: 'BUS008',
    stops: ['Assaigoli', 'BC Road', 'Deralakatte', 'Kaikamba (BC Road)', 'Kanchana', 'Konaje', 'Kuttar', 'Melkar', 
            'Modankap', 'Mudipu', 'Pachinadka', 'Panemangalore', 'Pandith House', 'Sajipa', 'Yenepoya']
  },
  'Route 9': {
    busNumber: 'BUS009',
    stops: ['Adyar', 'Adyar P O', 'Alape', 'Bejai Circle', 'Bejai Kapikad Kapikaad', 'Calmady', 'Derebail Church', 
            'Derebail Konchady', 'Konchadi Kandak (Land links)', 'Kottara Cross', 'KSRTC Bus Stand', 'Kuntikan', 
            'Malaemere', 'Museum', 'Padavu School', 'Padil Junction', 'Theerthakere']
  },
  'Route 10': {
    busNumber: 'BUS010',
    stops: ['Ballalbagh', 'Bejai Church School', 'Bovikanam', 'Bunts Hostel', 'Capitanio', 'Chilimbi', 'City Hospital', 
            'CV Nayak Hall', 'Ekkur', 'Farangipet', 'Kadri Mallikatte', 'Koodalkat', 'Kottara Chowki', 'Lady Hill', 
            'Lalbagh', 'Nanthur', 'New Bus Store', 'PVS', 'Shaktinagar', 'Shivabagh']
  },
  'Route 11': {
    busNumber: 'BUS011',
    stops: ['Ganjimatta', 'Kaikamba', 'Kalpane', 'Moodabidri', 'Polali', 'Polali Dwara', 'Yedapadavu']
  },
  'Route 12': {
    busNumber: 'BUS012',
    stops: ['Boloor', 'Carstreet', 'Hampankatta', 'Jyothi', 'Kudroli', 'Padil', 'Pumpwell', 'Temple Square', 
            'Venkatagrama Temple']
  }
};

// Helper function to get all stops in alphabetical order
export const getAllStops = () => {
  const allStops = new Set();
  Object.values(busRoutes).forEach(route => {
    route.stops.forEach(stop => allStops.add(stop));
  });
  return Array.from(allStops).sort();
};

// Helper function to find bus route by stop
export const findBusDetailsByStop = (stop) => {
  for (const [routeName, routeInfo] of Object.entries(busRoutes)) {
    if (routeInfo.stops.includes(stop)) {
      return {
        routeName,
        busNumber: routeInfo.busNumber,
        stops: routeInfo.stops
      };
    }
  }
  return null;
};