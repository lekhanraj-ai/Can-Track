export const busRoutes = {
  'Route 1': {
    busNumber: 'BUS001',
    stops: ['Talapady', 'Beeri', 'Kotekar', 'Kolya']
  },
  'Route 2': {
    busNumber: 'BUS002',
    stops: ['Puttur (Darbe Circle)', 'Bus Stand', 'Bolwar', 'Nagara', 'Kabaka', 'Mani', 'Kalladka']
  },
  'Route 3': {
    busNumber: 'BUS003',
    stops: ['Kavoor', 'Bondel', 'Padavinangadi', 'Mary Hill', 'Yeyyadi', 'KPT', 'Nanthoar Junction', 'Bikkarnakatte']
  },
  'Route 4': {
    busNumber: 'BUS004',
    stops: ['NITK', 'Thadambail', 'Marigudi (Surathkal)', 'Suraj Hotel', 'Govindadas College', 'Hosabettu', 'Honnavatte', 
            'Kulal Pannambur', 'Kuloor', 'Kodical Cross', 'Chowki Canara Bank']
  },
  'Route 5': {
    busNumber: 'BUS005',
    stops: ['RTO', 'Pandeshwar', 'Mangala Devi', 'Marnamikatte', 'Nandigudde', 'Velencia', 'Kankandy']
  },
  'Route 6': {
    busNumber: 'BUS006',
    stops: ['Ashok Nagar', 'Daivajna Hall', 'Marigudi', 'Urwa Market', 'Mannagudda', 'Durga Mahal', 'Adyarkatte']
  },
  'Route 7': {
    busNumber: 'BUS007',
    stops: ['Kumpala', 'Ullala', 'Thokkottu', 'Kallapu', 'Jeppinamogaru', 'Yekkuru', 'Gorigudda', 'Ujjodi', 'Pumpwell']
  },
  'Route 8': {
    busNumber: 'BUS008',
    stops: ['Pandith House', 'Kuttar', 'Yenepoya', 'Deralakatte', 'Kanchana', 'Assaigoli', 'Konaje', 'Mudipu', 'Sajipa', 
            'Melkar', 'Panemangalore', 'BC Road', 'Kaikamba (BC Road)', 'Modankap', 'Pachinadka']
  },
  'Route 9': {
    busNumber: 'BUS009',
    stops: ['Malaemere', 'Derebail Konchady', 'Konchadi Kandak (Land links)', 'Derebail Church', 'Kuntikan', 'Kottara Cross', 
            'Bejai Kapikad Kapikaad', 'KSRTC Bus Stand', 'Bejai Circle', 'Museum', 'Padavu School', 'Alape', 'Padil Junction', 
            'Adyar', 'Adyar P O', 'Theerthakere', 'Calmady']
  },
  'Route 10': {
    busNumber: 'BUS010',
    stops: ['Kottara Chowki', 'Ekkur', 'Shaktinagar', 'Bovikanam', 'New Bus Store', 'Chilimbi', 'Lady Hill', 'Lalbagh', 
            'Ballalbagh', 'Capitanio', 'Bejai Church School', 'PVS', 'Bunts Hostel', 'CV Nayak Hall', 'City Hospital', 
            'Kadri Mallikatte', 'Shivabagh', 'Nanthur', 'Koodalkat', 'Farangipet']
  },
  'Route 11': {
    busNumber: 'BUS011',
    stops: ['Moodabidri', 'Yedapadavu', 'Ganjimatta', 'Kaikamba', 'Polali Dwara', 'Polali', 'Kalpane']
  },
  'Route 12': {
    busNumber: 'BUS012',
    stops: ['Kudroli', 'Boloor', 'Carstreet', 'Venkatagrama Temple', 'Temple Square', 'Hampankatta', 'Jyothi', 'Pumpwell', 'Padil']
  }
};

export const findBusDetailsByStop = (pickupPoint) => {
  for (const [routeName, route] of Object.entries(busRoutes)) {
    if (route.stops.includes(pickupPoint)) {
      return {
        routeName,
        busNumber: route.busNumber
      };
    }
  }
  return null;
};