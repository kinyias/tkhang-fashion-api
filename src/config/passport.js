const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const prisma = require('../lib/prisma')

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.nguoiDung.findUnique({
        where: { ma: payload.sub },
      });

      if (!user) {
        return done(null, false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.nguoiDung.findUnique({
          where: { ma_google: profile.id },
        });

        if (!user) {
          // Check if user exists with the same email
          const existingUser = await prisma.nguoiDung.findUnique({
            where: { email: profile.emails[0].value },
          });

          if (existingUser) {
            // Link Google account to existing user
            user = await prisma.nguoiDung.update({
              where: { ma: existingUser.ma },
              data: { ma_google: profile.id },
            });
          } else {
            // Create new user
            const nameParts = profile.displayName
              ? profile.displayName.split(' ')
              : ['Unknown'];
            const ho = nameParts[0];
            const ten =
              nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            user = await prisma.nguoiDung.create({
              data: {
                ma_google: profile.id,
                email: profile.emails[0].value,
                ho: ho,
                ten: ten,
                vai_tro: 'khach_hang',
                xac_thuc_email: true,
              },
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
