import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { auth, db as firestore } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer } from "react-toastify";
import { format, addDays, subDays } from "date-fns";

import Macronutrients from "../component/WeeklyMacroNutritionChart";
import VitaminChart from "../component/WeeklyMicroNutrionChart";
import ProfileHeader from "../component/ProfileHeader";
import NutritionDataDisplay from "../component/NutritionDataDisplay.jsx";
import NutritionLoadingScreen from "../component/Loading.jsx";

function Dashboard() {
  const [nutritionData, setNutritionData] = useState(null);
  const [todayNutritionData, setTodayNutritionData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loadingNutritionData, setLoadingNutritionData] = useState(false);
  const [loadingProfileCheck, setLoadingProfileCheck] = useState(true);
  const [loading, setLoading] = useState(true); // Initial loading for data fetch
  const navigate = useNavigate();

  const currentDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const checkAuthAndFetchUserData = async () => {
    const user = auth.currentUser;

    if (!user) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(firestore, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();

        setUserName(data.displayName || "User");
        setPhoneNumber(data.phoneNumber || "No phone number");

        const requiredFields = [
          "phoneNumber",
          "country",
          "gender",
          "age",
          "weight",
          "height",
          "activity",
        ];
        const isComplete = requiredFields.every((field) => data[field]);
        setIsProfileComplete(isComplete);
        setLoadingProfileCheck(false); // Completeness check done

        setTimeout(() => {
          setLoading(false);
        }, 2000); // Delay for 3000 milliseconds

        // setLoading(false); // Stop other loading
      } else {
        // If user data doesn't exist, consider profile incomplete
        setIsProfileComplete(false);
        setLoadingProfileCheck(false);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setIsProfileComplete(false); // Fallback to incomplete on error
      setLoadingProfileCheck(false);
    }
  };

  useEffect(() => {
    checkAuthAndFetchUserData();
    fetchTodayNutritionData();
  }, []);

  useEffect(() => {
    // Fetch nutrition data for the selected date
    fetchNutritionData();
  }, [selectedDate]);

  const fetchTodayNutritionData = async () => {
    setLoadingNutritionData(true);
    const user = auth.currentUser;
    if (!user) return;

    const formattedDate = format(new Date(), "yyyy-MM-dd");
    try {
      const nutritionDoc = await getDoc(
        doc(firestore, `users/${user.uid}/nutritionData/${formattedDate}`)
      );
      if (nutritionDoc.exists()) {
        setTodayNutritionData(nutritionDoc.data());
        setLoadingNutritionData(false);
      } else {
        setTodayNutritionData(null); // No data for this date
        setLoadingNutritionData(false);
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
      setLoadingNutritionData(false);
    }
  };

  const fetchNutritionData = async () => {
    setLoadingNutritionData(true);
    const user = auth.currentUser;
    if (!user) return;

    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      const nutritionDoc = await getDoc(
        doc(firestore, `users/${user.uid}/nutritionData/${formattedDate}`)
      );
      if (nutritionDoc.exists()) {
        setNutritionData(nutritionDoc.data());
        setLoadingNutritionData(false);
      } else {
        setNutritionData(null); // No data for this date
        setLoadingNutritionData(false);
      }
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
      setLoadingNutritionData(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePreviousDate = () => {
    setSelectedDate((prevDate) => subDays(prevDate, 1));
  };

  const handleNextDate = () => {
    setSelectedDate((prevDate) => addDays(prevDate, 1));
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Redirect to onboarding if profile is incomplete
  if (!loadingProfileCheck && !isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  // Loading screen
  if (loading || loadingProfileCheck) {
    return (
      <NutritionLoadingScreen></NutritionLoadingScreen>
      // <div className="flex items-center justify-center h-screen bg-[#FCDDF2] text-[#0C4767]">
      //   {/* <p className="text-xl">Loading...</p> */}
      // </div>
    );
  }

  // if (!isAuthenticated) {
  //   return <Navigate to="/home" replace />;
  // }

  // if (!isProfileComplete) {
  //   return <Navigate to="/onboarding" />;
  // }

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-[#FCDDF2] text-[#0C4767]">
  //       <p className="text-xl">Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-[#FCDDF2] min-h-screen text-[#0C4767] flex flex-col items-center p-6">
      <div className="w-full max-w-8xl p-6 bg-white rounded-lg shadow-lg">
        {/* Profile Header */}
        <ProfileHeader
          name={userName}
          phone={phoneNumber}
          date={currentDate}
          todayNutritionData={todayNutritionData ? todayNutritionData : 0}
          onLogout={logout}
          onEditProfile={() => navigate("/user-form")}
        />

        {/* Logout Button */}
        {/* <div className="w-full max-w p-4 flex justify-end">
          <LogoutIcon
            className="text-4xl cursor-pointer text-[#FF7F2A] hover:text-[#6E0D25]"
            onClick={logout}
          />
        </div> */}
        {/* Date and Profile Section */}
        {/* <div className="flex flex-col md:flex-row items-stretch gap-6 mb-8"> */}
        {/* <div className="flex flex-col">
            <h1 className="text-start text-2xl italic">today is</h1>
            <h1 className="text-start text-3xl font-bold mb-6 font-mono">
              {currentDate}
            </h1>

            <div className="flex flex-row items-start">
              <ProfileIcon
                className="text-6xl cursor-pointer text-[#FF7F2A] hover:text-[#6E0D25] pr-4"
                onClick={() => navigate("/user-form")}
              />

              <div className="text-start">
                <p className="text-lg">
                  {loadingProfile ? (
                    <p className="text-gray-400">Loading Profile</p>
                  ) : (
                    `Name:
                  ${userName}`
                  )}
                </p>
                <p className="text-lg">
                  {loadingProfile ? (
                    <p className="text-gray-400"></p>
                  ) : (
                    `Phone:
                  ${phoneNumber}`
                  )}
                </p>
              </div>
            </div>
          </div> */}

        {/* Nutrition Data Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1"> */}
        {/* Macronutrients Summary */}
        {/* <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-md shadow-md flex flex-col justify-center">
              <p className="font-bold text-2xl font-mono text-start">
                Today's <br /> Macronutrients Consumption
              </p>
              <p className="text-3xl text-end font-bold">
                {todayNutritionData
                  ? `${
                      todayNutritionData.calories +
                      todayNutritionData.protein +
                      todayNutritionData.fat +
                      todayNutritionData.carbs +
                      todayNutritionData.fiber
                    } g`
                  : "No Data"}
              </p>
            </div> */}

        {/* Calories */}
        {/* <div className="bg-gray-200 text-black p-4 rounded-md shadow-md flex flex-col justify-top">
              <p className="font-bold text-2xl text-end font-mono">calories</p>
              <p className="text-5xl font-mono font-semibold pt-2">
                {todayNutritionData
                  ? `${todayNutritionData.calories} kcal`
                  : "0"}
              </p>
            </div> */}

        {/* Protein */}
        {/* <div className="bg-gray-400 text-black p-4 rounded-md shadow-md flex flex-col justify-top">
              <p className="font-bold text-2xl text-start font-mono">protein</p>
              <p className="text-5xl font-mono font-semibold pt-2">
                {todayNutritionData ? `${todayNutritionData.protein} g` : "0"}
              </p>
            </div> */}

        {/* Fats */}
        {/* <div className="bg-gray-600 text-white p-4 rounded-md shadow-md flex flex-col justify-top">
              <p className="font-bold text-2xl text-start font-mono">fats</p>
              <p className="text-5xl font-mono font-semibold pt-2">
                {todayNutritionData ? `${todayNutritionData.fat} g` : "0"}
              </p>
            </div> */}
        {/* </div> */}
        {/* </div> */}

        {/* Conditional message if profile is incomplete */}
        {!isProfileComplete && (
          <p className="mb-4 text-red-500 text-center md:text-left">
            Please Complete The Profile To Try The Feature
          </p>
        )}

        {/* <button
          onClick={handleButtonClick}
          disabled={!isProfileComplete}
          className={`w-full md:w-auto py-2 px-6 rounded-md font-medium flex flex-row justify-center items-center space-x-2 ${
            isProfileComplete
              ? "bg-[#2bfe87] hover:bg-[#1b5728] text-black"
              : "bg-gray-500 text-gray-400 cursor-not-allowed"
          }`}
        >
          <span>Connect With</span> <FaWhatsapp className="text-xl" />
        </button> */}

        {/* Date Navigation */}
        {/* <div className="flex items-center justify-left space-x-4 pt-8">
          <h2 className="text-2xl font-bold">
            Nutrition Data for
            
          </h2>
          <FaArrowLeft
            className="text-2xl cursor-pointer hover:text-[#6E0D25]"
            onClick={handlePreviousDate}
          />
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-2xl text-[#FF7F2A]" />
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              className="p-2 bg-[#84A98C] text-white rounded-md cursor-pointer text-center"
            />
          </div>
          <FaArrowRight
            className="text-2xl cursor-pointer text-[#FF7F2A] hover:text-[#6E0D25]"
            onClick={handleNextDate}
          />
        </div> */}

        {/* Nutrition Display Section */}
        <NutritionDataDisplay
          nutritionData={nutritionData}
          selectedDate={selectedDate}
          handleDateChange={handleDateChange}
          handleNextDate={handleNextDate}
          handlePrevDate={handlePreviousDate}
          loading={loadingNutritionData}
        ></NutritionDataDisplay>
        {/* <NutritionDisplay
          nutritionData={nutritionData}
          loading={loadingNutritionData}
        /> */}

        <div className="md:flex">
          {/* Weekly Chart Section */}
          <Macronutrients selectedDate={selectedDate} />
          {/* Vitamin Chart Section */}
          <VitaminChart selectedDate={selectedDate} />
        </div>

        {/* <div className="flex flex-col md:flex-row md:justify-center md:space-x-4">
          <button
            onClick={handleAddNutritionData}
            className="w-full md:w-auto py-2 px-6 rounded-md font-medium bg-[#FF7F2A] hover:bg-[#6E0D25] text-white"
          >
            Add Data
          </button>
        </div> */}
      </div>
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}

export default Dashboard;
