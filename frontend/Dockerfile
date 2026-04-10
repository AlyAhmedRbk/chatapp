# Serve React app with Nginx
FROM nginx:latest

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built React app dist folder
COPY frontend/dist /usr/share/nginx/html

# Fix permissions for nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chmod -R g+w /var/cache/nginx

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]