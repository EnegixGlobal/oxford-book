"use client";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

// Function to convert relative dates to formatted dates
const formatDate = (dateStr: string): string => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (dateStr.includes("a year ago")) {
    return `Aug ${currentYear - 1}`;
  } else if (dateStr.includes("2 years ago")) {
    return `Aug ${currentYear - 2}`;
  } else if (dateStr.includes("3 years ago")) {
    return `Aug ${currentYear - 3}`;
  } else if (dateStr.includes("4 years ago")) {
    return `Aug ${currentYear - 4}`;
  } else if (dateStr.includes("5 years ago")) {
    return `Aug ${currentYear - 5}`;
  } else if (dateStr.includes("6 years ago")) {
    return `Aug ${currentYear - 6}`;
  } else if (dateStr.includes("a month ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    return `${monthNames[prevMonth]} ${currentYear}`;
  } else if (dateStr.includes("2 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const twoMonthsAgo =
      currentMonth < 2 ? currentMonth + 10 : currentMonth - 2;
    return `${monthNames[twoMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("3 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const threeMonthsAgo =
      currentMonth < 3 ? currentMonth + 9 : currentMonth - 3;
    return `${monthNames[threeMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("4 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const fourMonthsAgo =
      currentMonth < 4 ? currentMonth + 8 : currentMonth - 4;
    return `${monthNames[fourMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("5 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const fiveMonthsAgo =
      currentMonth < 5 ? currentMonth + 7 : currentMonth - 5;
    return `${monthNames[fiveMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("6 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const sixMonthsAgo = currentMonth < 6 ? currentMonth + 6 : currentMonth - 6;
    return `${monthNames[sixMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("7 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const sevenMonthsAgo =
      currentMonth < 7 ? currentMonth + 5 : currentMonth - 7;
    return `${monthNames[sevenMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("8 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const eightMonthsAgo =
      currentMonth < 8 ? currentMonth + 4 : currentMonth - 8;
    return `${monthNames[eightMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("9 months ago")) {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const nineMonthsAgo =
      currentMonth < 9 ? currentMonth + 3 : currentMonth - 9;
    return `${monthNames[nineMonthsAgo]} ${currentYear}`;
  } else if (dateStr.includes("a week ago")) {
    return `Dec ${currentYear}`;
  } else if (dateStr.includes("5 days ago")) {
    return `Dec ${currentYear}`;
  } else if (dateStr.includes("2 weeks ago")) {
    return `Dec ${currentYear}`;
  }

  return dateStr; // Return original if no match
};

const reviews: Review[] = [
  {
    id: "1",
    name: "Aditi Swaroop",
    rating: 5,
    comment:
      "It's a gem in the city of Ranchi. Book lovers, do visit. Great collection of books for all types of readers. Hope they grow it further!",
    date: formatDate("4 months ago"),
  },
  {
    id: "2",
    name: "Riya Majhi",
    rating: 5,
    comment:
      "This place is very beautiful, aur books ke mamle me bahot wide range hai, bachcho ke liye bhi bahot se achche books hai, the owner is also very kind hearted and sweet.",
    date: formatDate("a month ago"),
  },
  {
    id: "3",
    name: "Ayushman Arun",
    rating: 5,
    comment:
      "Oxford Book House is the perfect escape for anyone who loves books. The moment you walk in, you're greeted with the comforting scent of paper and the warm glow of ambient lighting. The store is beautifully organized, making it easy to find what you're looking for.",
    date: formatDate("a year ago"),
  },
  {
    id: "4",
    name: "Riya Pandey",
    rating: 5,
    comment:
      "Really very nice collection are there. Must visit. Great book qualities.",
    date: formatDate("2 months ago"),
  },
  {
    id: "5",
    name: "Akash Kumar",
    rating: 3,
    comment:
      "The well arranged and modern type Book House situated in first floor H Square Building. The Book Shop is arranged very well and ambience is designed very well. A lot of unique book collections are available here.",
    date: formatDate("3 years ago"),
  },
  {
    id: "6",
    name: "Rajendra Dangil",
    rating: 5,
    comment:
      "Want a novel, fiction or any other books? Here's the destination! Felt good to see Ranchi growing day by day by adding these type of valuable stores.",
    date: formatDate("2 years ago"),
  },
  {
    id: "7",
    name: "Prabhu Oraon",
    rating: 4,
    comment:
      "It was a great experience to visit the store. The store has a wide range of books, catering to diverse interests and age groups. The selection is well-organized and easy to navigate.",
    date: formatDate("4 months ago"),
  },
  {
    id: "8",
    name: "James Soren",
    rating: 4,
    comment:
      "Its a woow shop for book readers, well hygiene, well maintained, owner is decent and well mannered. You can also spend time in shop, you can take your time in selecting your books, No rush. All kinds of book are available in the store.",
    date: formatDate("2 years ago"),
  },
  {
    id: "9",
    name: "Ajay K Singh",
    rating: 5,
    comment:
      "Excellent collection of books. The best brick and mortar Book House in Ranchi",
    date: formatDate("2 months ago"),
  },
  {
    id: "10",
    name: "Naman Choudhary",
    rating: 4,
    comment:
      "I've been buying books from here for the past two years. Amazing collection, great quality original books. The owner is super kind. I believe anyone either looking to start reading, or already a reader, must visit here.",
    date: formatDate("2 months ago"),
  },
  {
    id: "11",
    name: "Rishabh Amaz",
    rating: 5,
    comment:
      "Absolutely love this Book House! It has a cozy atmosphere, a great selection of titles, and the staff are always friendly and helpful. A perfect spot for any book lover!",
    date: formatDate("2 months ago"),
  },
  {
    id: "12",
    name: "SHALINI",
    rating: 5,
    comment:
      "The owner is very sweet and humble, good collection of books. Must visit",
    date: formatDate("4 months ago"),
  },
  {
    id: "13",
    name: "Sefali Das",
    rating: 5,
    comment:
      "1st visit and I'm really impressed by the collection. Should have more manga collection but apart from that, it you really a book warm should visit here. You will not regret.",
    date: formatDate("4 months ago"),
  },
  {
    id: "14",
    name: "Nikhil Chaturvedi",
    rating: 5,
    comment:
      "It's a privilege to have such a cozy Book House in town, where the smart collection could keep you glued for hours. I absolutely loved the collection and personal recommendations from shop owner.",
    date: formatDate("6 years ago"),
  },
  {
    id: "15",
    name: "Sneha Roy",
    rating: 5,
    comment:
      "This store has a very good collection of fictional and non-fictional books..this store is super cute and cozy with variety of books..owner of this shop is really very helpful and friendly..there are many books available which we only get on online...",
    date: formatDate("3 years ago"),
  },
  {
    id: "16",
    name: "Komal Sinha",
    rating: 5,
    comment:
      "Nice place for book worms, they have all novel collection as well as comic books which is kind of nostalgia to me the owner was super friendly the store is clean and the books are so well maintained.",
    date: formatDate("3 years ago"),
  },
  {
    id: "17",
    name: "Kriti Agarwal",
    rating: 5,
    comment:
      "I've been there more than 10 times and it's my fav Book House! They have amazing, fresh and wide range of collections. Good service and the owner gives great suggestions",
    date: formatDate("5 months ago"),
  },
  {
    id: "18",
    name: "Aditi Sidhant",
    rating: 5,
    comment:
      "The Book House is a quaint exception in the midst of the chaos of the city. It is a haven for avid book readers as Mr. Manish has excellent recommendations.",
    date: formatDate("a month ago"),
  },
  {
    id: "19",
    name: "Bhargav Raj",
    rating: 5,
    comment:
      "One of the best Book Houses in the city, a well curated and excellent collection, the owner at the shop is really well informed and humble, overall a great experience",
    date: formatDate("2 months ago"),
  },
  {
    id: "20",
    name: "Premsagar devi",
    rating: 5,
    comment:
      "Best Book House in ranchi. I will personally recommend this book store for book lovers in ranchi. You can't find another book store that provides the most trendy yet classic books in ranchi.",
    date: formatDate("4 months ago"),
  },
];

export default function GoogleReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 4;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + reviewsPerPage >= reviews.length
        ? 0
        : prevIndex + reviewsPerPage
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - reviewsPerPage < 0
        ? Math.max(0, reviews.length - reviewsPerPage)
        : prevIndex - reviewsPerPage
    );
  };

  const visibleReviews = reviews.slice(
    currentIndex,
    currentIndex + reviewsPerPage
  );

  return (
    <section className="py-16 bg-gradient-to-b from-white via-purple-50/40 to-purple-100/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What Readers Say on{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600">
              Google
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Trusted by book lovers across India. Real feedback from real
            customers.
          </p>
        </motion.div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleReviews.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white/80 backdrop-blur rounded-xl p-5 shadow-sm hover:shadow-md border border-purple-100/60 transition"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white flex items-center justify-center text-sm font-semibold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {r.name}
                    </p>
                    <p className="text-[11px] text-gray-500">{r.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < r.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">
                  {r.comment}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200 hover:scale-110"
            disabled={currentIndex + reviewsPerPage >= reviews.length}
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({
            length: Math.ceil(reviews.length / reviewsPerPage),
          }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * reviewsPerPage)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                Math.floor(currentIndex / reviewsPerPage) === index
                  ? "bg-purple-600 w-8"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow border">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-800">
              5.0 / 5 Average Rating
            </span>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=oxford+book+house+ranchi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:opacity-90"
          >
            View more reviews on Google →
          </a>
        </div>
      </div>
    </section>
  );
}
