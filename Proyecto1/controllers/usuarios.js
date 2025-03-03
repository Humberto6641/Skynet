// controllers/usuarios.js
const express = require('express');
const supabase = require('../configurations/db_conf');
const bcrypt = require('bcrypt');

// Funciones de controlador

const getAllUsers = async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuario').select('*');
        if (error) {
            throw new Error('Error al obtener usuarios: ' + error.message);
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const { data, error } = await supabase.from('usuario').select('*').eq('id', req.params.id).single();
        if (error) {
            throw new Error('Usuario no encontrado');
        }
        res.json(data);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const createUser = async (req, res) => {
    const { nombre, correo, telefono, password } = req.body;
    const rol = 'Técnico'; // Rol por Default 

    if (!nombre || !correo || !telefono || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const { data: existingUser, error: checkError } = await supabase.from('usuario').select('*').eq('correo', correo).single();
        if (checkError && checkError.code !== 'PGRST116') throw new Error(checkError.message);
        if (existingUser) throw new Error('El correo ya está registrado');

        const hashedPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('usuario').insert([ { nombre, correo, telefono, password: hashedPassword, rol } ]);

        if (error) {
            throw new Error('Error al registrar usuario: ' + error.message);
        }

        res.status(201).json({ message: 'Usuario creado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    const { nombre, correo, telefono, rol, password } = req.body;
    const updatedFields = {};

    if (password) {
        console.log("Contraseña recibida en el backend:", password);
        updatedFields.password = await bcrypt.hash(password, 10);
        console.log("Contraseña encriptada antes de guardar:", updatedFields.password);
    }

    if (nombre) updatedFields.nombre = nombre;
    if (correo) updatedFields.correo = correo;
    if (telefono) updatedFields.telefono = telefono;
    if (rol) updatedFields.rol = rol;

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    try {
        const { data, error } = await supabase.from('usuario').update(updatedFields).eq('id', req.params.id);
        if (error) {
            throw new Error('Error al actualizar usuario: ' + error.message);
        }

        res.json({ message: 'Usuario actualizado exitosamente', data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { error } = await supabase.from('usuario').delete().eq('id', req.params.id);
        if (error) {
            throw new Error('Error al eliminar usuario: ' + error.message);
        }
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};