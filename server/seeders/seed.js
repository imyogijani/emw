import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import colors from 'colors';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Brand from '../models/brandModel.js';
import Seller from '../models/sellerModel.js';
import TechnicalDetails from '../models/technicalDetails.js';


const users = [
  {
    names: 'Admin User',
    email: 'admin@example.com',
    password: await bcrypt.hash('123456', 10),
    role: 'admin',
    phone: '1234567890',
    isAdmin: true,
  },
  {
    names: 'John Doe',
    email: 'john@example.com',
    password: await bcrypt.hash('123456', 10),
    role: 'client',
    phone: '0987654321',
    address: '123 Main St',
  },
];

const categories = [
  { name: 'Electronics', image: '/images/electronics.jpg' },
  { name: 'Books', image: '/images/books.jpg' },
];

const brands = [
  { name: 'Apple', image: '/images/apple.jpg' },
  { name: 'Samsung', image: '/images/samsung.jpg' },
];

const sellers = [
  {
    name: 'Tech Seller',
    email: 'tech@example.com',
    phone: '1112223333',
    address: '456 Tech Lane',
    shopName: 'Tech Gadgets',
  },
];

const technicalDetails = [
  {
    title: 'Electronics Technical Details',
    weight: '200g',
    color: ['Black', 'Silver'],
  },
  {
    title: 'Books Technical Details',
    weight: '500g',
    color: ['Red', 'Blue'],
  },
];

const products = [
  {
    name: 'Airpods Wireless Bluetooth Headphones',
    image: ['/images/airpods.jpg'],
    description:
      'Bluetooth technology lets you connect it with compatible devices wirelessly High-quality AAC audio offers immersive listening experience Built-in microphone allows you to take calls while working',
    price: 89.99,
    discount: 10,
    stock: 10,
    status: 'In Stock',
    averageRating: 4.5,
    totalReviews: 12,
    isPremium: false,
  },
  {
    name: 'iPhone 11 Pro 256GB Memory',
    image: ['/images/phone.jpg'],
    description:
      'Introducing the iPhone 11 Pro. A transformative triple-camera system that adds tons of capability without complexity. An unprecedented leap in battery life. And a mind-blowing chip that doubles down on machine learning and pushes the boundaries of what a smartphone can do. Welcome to the first iPhone powerful enough to be called Pro.',
    price: 599.99,
    discount: 5,
    stock: 7,
    status: 'In Stock',
    averageRating: 4.0,
    totalReviews: 8,
    isPremium: false,
  },
];

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Seller.deleteMany();
    await TechnicalDetails.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Seller.deleteMany();
    await TechnicalDetails.deleteMany();

    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }
    const electronicsCategory = createdCategories.find(cat => cat.name === 'Electronics')._id;

    const createdBrands = await Brand.insertMany(brands);
    const appleBrand = createdBrands.find(brand => brand.name === 'Apple')._id;
    const samsungBrand = createdBrands.find(brand => brand.name === 'Samsung')._id;

    const createdSellers = [];
    for (const sellerData of sellers) {
      const seller = new Seller({ ...sellerData, user: adminUser });
      await seller.save();
      createdSellers.push(seller);
    }
    const techSeller = createdSellers[0]._id;

    const createdTechnicalDetails = [];
    for (const detailData of technicalDetails) {
      const detail = new TechnicalDetails({ ...detailData, createdBy: adminUser });
      await detail.save();
      createdTechnicalDetails.push(detail);
    }
    const sampleTechnicalDetails = createdTechnicalDetails[0]._id;

    const sampleProducts = products.map((product) => {
      return {
        ...product,
        user: adminUser,
        category: electronicsCategory,
        brand: product.name.includes('iPhone') || product.name.includes('Airpods') ? appleBrand : samsungBrand,
        seller: techSeller,
        technicalDetails: sampleTechnicalDetails,
      };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}