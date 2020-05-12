const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');
const User = mongoose.model('User');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: `That file type isn't allowed!` }, false);
        }
    }
};

exports.homePage = (req, res) => {
    res.render('index');
}

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
}

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
    // Check if there is no new file to resize
    if (!req.file) {
        next(); // Skip to create store
        return;
    }
    // Get File Type & Rename
    const extension = req.file.mimetype.split('/')[1]; 
    req.body.photo = `${uuid.v4()}.${extension}`;
    // Resize the image
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // Proceed once file is saved
    next();
}

// REMEMBER THIS: async/await
exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    await store.save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (page * limit) - limit;
    // 1. Query DB for list of stores
    const storesPromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({ created: 'desc' });

    const countPromise = Store.count();

    const [stores, count] = await Promise.all([storesPromise, countPromise]);

    const pages = Math.ceil(count / limit);

    if (!stores.length && skip) {
        req.flash('info', `You asked for page ${page}, but that doesn't exist so you were redirected to page ${pages}.`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', { title: 'Stores', stores, page, pages, count });
}

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it');
    }
}

exports.editStore = async (req, res) => {
    // 1. Find Store Given ID
    const store = await Store.findOne({ _id: req.params.id });
    // 2. Confirm they are owner of store
    confirmOwner(store, req.user);
    // 3. Render the edit form so user can update their store
    res.render('editStore', { title: `Edit ${store.name}`, store });
}

exports.updateStore = async (req, res) => {
    // Set the location data to be a point
    req.body.location.type = 'Point';
    // 1. Find & Update Store Given ID
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // Return the new store instead of the old
        runValidators: true
    }).exec();
    // 2. Redirect to to store
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/store/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store.id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug })
        .populate('author reviews');
    res.render('store', { store, title: store.name });
    if (!store) return next();
}

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };
    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
    res.render('tag', { tags, title: 'Tags', tag, stores });
}

// REMEMBER: API Search endpoint
// .find, .sort, .limit
exports.searchStores = async (req, res) => {
    const stores = await Store
    // first find stores that match
    .find({
        $text: {
            $search: req.query.q,
        } 
    }, {
        score: { $meta: 'textScore' }
    })
    // then sort them
    .sort({
        score: { $meta: 'textScore' }
    })
    // limit to 5 results
    .limit(5)
    res.json(stores);
}

exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000 // 10km
            }
        }
    }
    const stores = await Store.find(q).select('slug name location description photo').limit(10);
    res.json(stores);
};

exports.mapPage = (req, res) => {
    res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
            { [operator]: { hearts: req.params.id } },
            { new: true }
        );
    res.json(user);
};

exports.getHeartedStores = async (req, res) => {
    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });
    res.render('stores', { title: 'Hearted Stores', stores });
}

exports.getTopStores = async (req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, title: '☆ Top Stores!' });
}