import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc,
  updateDoc,
  runTransaction,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [captainSchedules, setCaptainSchedules] = useState({});
  const [productivityTargets, setProductivityTargets] = useState({});
  const [dailyData, setDailyData] = useState({});
  const [globalStats, setGlobalStats] = useState({});
  const [latestProductivity, setLatestProductivity] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset*60*1000));
    return localDate.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!currentUser) {
      setUsers([]);
      setDepartments([]);
      setCaptainSchedules({});
      setProductivityTargets({});
      setDailyData({});
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    });

    const unsubscribeDeps = onSnapshot(collection(db, 'departments'), (snapshot) => {
      const depsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDepartments(depsList);
    });

    const unsubscribeCaptainSchedules = onSnapshot(collection(db, 'captainSchedules'), (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setCaptainSchedules(data);
    });

    const unsubscribeLatestProductivity = onSnapshot(doc(db, 'productivity', 'LATEST'), async (docSnap) => {
      if (docSnap.exists()) {
        setLatestProductivity(docSnap.data());
      } else {
        try {
          // Fallback if LATEST doesn't exist yet
          const q = query(collection(db, 'productivity'), orderBy('__name__', 'desc'), limit(1));
          const querySnapshot = await getDocs(q);
          const docs = querySnapshot.docs.filter(d => d.id !== 'LATEST');
          if (docs.length > 0) {
            setLatestProductivity(docs[0].data());
          } else if (!querySnapshot.empty) {
            setLatestProductivity(querySnapshot.docs[0].data());
          }
        } catch (error) {
          console.error("Latest productivity fetch error:", error);
        }
      }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeDeps();
      unsubscribeCaptainSchedules();
      unsubscribeLatestProductivity();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedDate) return;

    const unsubscribeDaily = onSnapshot(doc(db, 'dailyData', selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setDailyData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setDailyData({
          id: selectedDate,
          hedefCiro: 0,
          gerceklesenCiro: 0,
          mvps: [],
          shifts: {},
          rekor: ''
        });
      }
      setLoadingData(false);
    });

    const unsubscribeGlobal = onSnapshot(doc(db, 'dailyData', 'LATEST_STATS'), (docSnap) => {
      if (docSnap.exists()) {
        setGlobalStats(docSnap.data());
      }
    });

    const unsubscribeProductivity = onSnapshot(doc(db, 'productivity', selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setProductivityTargets(docSnap.data());
      } else {
        // Fallback to latestProductivity if current date is empty
        setProductivityTargets(latestProductivity || {});
      }
    });

    return () => {
      unsubscribeDaily();
      unsubscribeGlobal();
      unsubscribeProductivity();
    };
  }, [selectedDate, currentUser, latestProductivity]);

  const updateDailyData = async (dateId, updates) => {
    try {
      const docRef = doc(db, 'dailyData', dateId);
      
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);
        const data = docSnap.exists() ? docSnap.data() : {};
        
        const finalUpdates = { ...updates };
        
        // Eğer shifts güncelleniyorsa, mevcut shifts ile birleştir
        if (updates.shifts !== undefined) {
          if (Object.keys(updates.shifts).length === 0) {
            finalUpdates.shifts = {};
          } else {
            const currentShifts = data.shifts || {};
            const newShifts = { ...currentShifts };
            
            Object.keys(updates.shifts).forEach(userId => {
              const val = updates.shifts[userId];
              if (val === null || (typeof val === 'object' && val._methodName === 'deleteField')) {
                delete newShifts[userId];
              } else {
                newShifts[userId] = val;
              }
            });
            
            finalUpdates.shifts = newShifts;
          }
        }

        if (!docSnap.exists()) {
          transaction.set(docRef, finalUpdates);
        } else {
          transaction.update(docRef, finalUpdates);
        }
      });
    } catch (error) {
      console.error("Günlük veri güncellenirken hata:", error);
      throw error;
    }
  };

  const updateCaptainSchedule = async (dateId, updates) => {
    try {
      const docRef = doc(db, 'captainSchedules', dateId);
      await setDoc(docRef, updates, { merge: true });
    } catch (error) {
      console.error("Kaptan güncellenirken hata:", error);
      throw error;
    }
  };

  const value = {
    users,
    departments,
    captainSchedules,
    productivityTargets,
    latestProductivity,
    dailyData,
    globalStats,
    loadingData,
    selectedDate,
    setSelectedDate,
    updateDailyData,
    updateCaptainSchedule
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
